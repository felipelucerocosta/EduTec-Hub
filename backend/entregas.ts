import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer storage for submissions
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'entrega-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

const getUserId = (req: Request) => req.session?.usuario?.id;

// POST /api/trabajos/:trabajoId/entregar - Submit assignment (Student)
router.post('/trabajos/:trabajoId/entregar', upload.single('archivo'), async (req: Request, res: Response) => {
  const { trabajoId } = req.params;
  const { comentario } = req.body;
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'Debes iniciar sesión para entregar.' });
  }

  try {
    // Check if work exists
    const trabajoQ = await pool.query('SELECT * FROM trabajos WHERE id = $1', [trabajoId]);
    if (trabajoQ.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado.' });
    }

    const trabajo = trabajoQ.rows[0];
    const now = new Date();
    const esTardia = trabajo.fecha_limite && new Date(trabajo.fecha_limite) < now;
    const estado = esTardia ? 'entrega_tardia' : 'entregado';

    const archivoNombre = req.file ? req.file.originalname : null;
    const archivoPath = req.file ? req.file.filename : null;

    // Check if already submitted
    const existingQ = await pool.query('SELECT id FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2', [trabajoId, userId]);
    
    if (existingQ.rows.length > 0) {
      // Update existing submission
      const updateQ = `
        UPDATE entregas 
        SET archivo_nombre = COALESCE($1, archivo_nombre),
            archivo_path = COALESCE($2, archivo_path),
            comentario = $3,
            estado = $4,
            fecha_entrega = CURRENT_TIMESTAMP
        WHERE trabajo_id = $5 AND alumno_id = $6
      `;
      await pool.query(updateQ, [archivoNombre, archivoPath, comentario || '', estado, trabajoId, userId]);
      return res.json({ success: true, message: 'Entrega actualizada correctamente' });
    } else {
      // Insert new submission
      const insertQ = `
        INSERT INTO entregas (trabajo_id, alumno_id, archivo_nombre, archivo_path, comentario, estado)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await pool.query(insertQ, [trabajoId, userId, archivoNombre, archivoPath, comentario || '', estado]);
      return res.status(201).json({ success: true, message: 'Trabajo entregado exitosamente' });
    }
  } catch (error) {
    console.error('Error al entregar trabajo:', error);
    return res.status(500).json({ error: 'Error al procesar la entrega' });
  }
});

// DELETE /api/trabajos/:trabajoId/retirar - Withdraw submission (Student)
router.delete('/trabajos/:trabajoId/retirar', async (req: Request, res: Response) => {
  const { trabajoId } = req.params;
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    await pool.query('DELETE FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2', [trabajoId, userId]);
    return res.json({ success: true, message: 'Entrega retirada correctamente' });
  } catch (error) {
    console.error('Error al retirar entrega:', error);
    return res.status(500).json({ error: 'Error al retirar la entrega' });
  }
});

// GET /api/trabajos/:trabajoId/entregas - List all submissions for a task (Teacher / Admin)
router.get('/trabajos/:trabajoId/entregas', async (req: Request, res: Response) => {
  const { trabajoId } = req.params;
  const userId = getUserId(req);
  const userRol = req.session?.usuario?.rol;

  if (!userId || (userRol !== 'profesor' && userRol !== 'admin')) {
    return res.status(403).json({ error: 'No tienes permiso para ver entregas de otros alumnos.' });
  }

  try {
    const query = `
      SELECT e.*, u.nombre_completo as alumno_nombre, u.correo as alumno_correo
      FROM entregas e
      JOIN usuarios u ON e.alumno_id = u.id_usuario
      WHERE e.trabajo_id = $1
      ORDER BY e.fecha_entrega DESC
    `;
    const result = await pool.query(query, [trabajoId]);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    return res.status(500).json({ error: 'Error al obtener entregas' });
  }
});

// POST /api/entregas/:id/calificar - Grade submission and provide feedback (Teacher / Admin)
router.post('/entregas/:id/calificar', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { calificacion, feedback } = req.body;
  const userId = getUserId(req);
  const userRol = req.session?.usuario?.rol;

  if (!userId || (userRol !== 'profesor' && userRol !== 'admin')) {
    return res.status(403).json({ error: 'Solo los profesores pueden calificar.' });
  }

  if (calificacion === undefined || calificacion === null) {
    return res.status(400).json({ error: 'La calificación es obligatoria.' });
  }

  try {
    const updateQ = `
      UPDATE entregas 
      SET calificacion = $1, feedback = $2, estado = 'corregido', fecha_calificacion = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    await pool.query(updateQ, [calificacion, feedback || '', id]);

    // Send notification to student
    const entregaQ = await pool.query('SELECT e.alumno_id, t.titulo FROM entregas e JOIN trabajos t ON e.trabajo_id = t.id WHERE e.id = $1', [id]);
    if (entregaQ.rows.length > 0) {
      const { alumno_id, titulo } = entregaQ.rows[0];
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'calificacion', $2, $3, 'entrega', $4)`,
        [alumno_id, `Trabajo calificado: ${titulo}`, `Tu entrega de "${titulo}" fue calificada con ${calificacion}/100.`, id]
      );
    }

    return res.json({ success: true, message: 'Calificación guardada exitosamente' });
  } catch (error) {
    console.error('Error al calificar entrega:', error);
    return res.status(500).json({ error: 'Error al calificar la entrega' });
  }
});

// GET /api/entregas/descargar/:filename - Download submission file
router.get('/entregas/descargar/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  return res.download(filePath);
});

export default router;
