import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verificarAccesoClase } from './permisos';
import { emitToClass, emitToUser } from './socket_bus';

const router = Router();

// Configure multer storage for submissions
const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
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

// POST /api/trabajos/:trabajoId/entregar - Submit assignment (Student enrolled in class)
router.post('/trabajos/:trabajoId/entregar', upload.single('archivo'), async (req: Request, res: Response) => {
  const { trabajoId } = req.params;
  const { comentario, integrantes } = req.body;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'Debes iniciar sesión para entregar.' });
  }

  try {
    // Check if work exists
    const trabajoQ = await pool.query('SELECT * FROM trabajos WHERE id = $1', [trabajoId]);
    if (trabajoQ.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado.' });
    }

    const trabajo = trabajoQ.rows[0];

    // Verificar que el alumno pertenezca a la clase del trabajo
    const { permitido, motivo } = await verificarAccesoClase(usuario, trabajo.clase_id);
    if (!permitido) {
      return res.status(403).json({ error: motivo || 'No tienes permisos para entregar trabajos en esta clase.' });
    }

    const now = new Date();
    const esTardia = trabajo.fecha_limite && new Date(trabajo.fecha_limite) < now;
    const estado = esTardia ? 'entrega_tardia' : 'entregado';

    const archivoNombre = req.file ? req.file.originalname : null;
    const archivoPath = req.file ? req.file.filename : null;

    // Procesar integrantes para trabajos grupales
    let memberIds: number[] = [Number(usuario.id)];
    const esGrupal = trabajo.tipo_entrega === 'grupal';

    if (esGrupal && integrantes) {
      try {
        const parsed = typeof integrantes === 'string' ? JSON.parse(integrantes) : integrantes;
        if (Array.isArray(parsed)) {
          const validNums = parsed.map(Number).filter((n: number) => !isNaN(n) && n > 0);
          memberIds = Array.from(new Set([Number(usuario.id), ...validNums]));
        }
      } catch (_e) {
        if (typeof integrantes === 'string') {
          const splitIds = integrantes.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
          memberIds = Array.from(new Set([Number(usuario.id), ...splitIds]));
        }
      }
    }

    // Validar que todos los integrantes pertenezcan a la misma clase
    if (memberIds.length > 1) {
      const verifyQ = `
        SELECT u.id_usuario, u.nombre_completo 
        FROM alumnos_clases ac
        JOIN clases c ON LOWER(TRIM(c.codigo)) = LOWER(TRIM(ac.codigo))
        JOIN usuarios u ON ac.alumno_id = u.id_usuario
        WHERE c.id = $1 AND u.id_usuario = ANY($2::int[])
      `;
      const verifyRes = await pool.query(verifyQ, [trabajo.clase_id, memberIds]);
      const validIds = new Set(verifyRes.rows.map((r: any) => Number(r.id_usuario)));
      
      for (const mId of memberIds) {
        if (!validIds.has(mId)) {
          return res.status(400).json({ error: 'Uno o más integrantes seleccionados no pertenecen a esta clase.' });
        }
      }
    }

    // Verificar si ya existe una entrega previa (propia o de algún compañero del grupo)
    let existingEntregaId: number | null = null;
    
    // 1. Chequeo directo por alumno_id
    const existingQ = await pool.query('SELECT id, alumno_id FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2', [trabajoId, usuario.id]);
    if (existingQ.rows.length > 0) {
      existingEntregaId = existingQ.rows[0].id;
    } else if (esGrupal) {
      // 2. Chequeo por grupo: verificar si el usuario o algún integrante ya tiene entrega registrada
      const existingGroupQ = `
        SELECT e.id, e.alumno_id, u.nombre_completo
        FROM entrega_integrantes ei
        JOIN entregas e ON ei.entrega_id = e.id
        JOIN usuarios u ON ei.usuario_id = u.id_usuario
        WHERE e.trabajo_id = $1 AND ei.usuario_id = ANY($2::int[])
      `;
      const existingGroupRes = await pool.query(existingGroupQ, [trabajoId, memberIds]);
      if (existingGroupRes.rows.length > 0) {
        // Si la entrega existente pertenece al mismo alumno que ahora actualiza, permitimos update
        const firstMatch = existingGroupRes.rows[0];
        if (Number(firstMatch.alumno_id) === Number(usuario.id)) {
          existingEntregaId = firstMatch.id;
        } else {
          return res.status(400).json({
            error: `El integrante "${firstMatch.nombre_completo}" ya cuenta con una entrega registrada para este trabajo.`
          });
        }
      }
    }

    // Transacción de guardado
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let entregaId: number;

      if (existingEntregaId) {
        // Actualizar entrega existente
        const updateQ = `
          UPDATE entregas 
          SET archivo_nombre = COALESCE($1, archivo_nombre),
              archivo_path = COALESCE($2, archivo_path),
              comentario = $3,
              estado = $4,
              fecha_entrega = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING id
        `;
        const uRes = await client.query(updateQ, [archivoNombre, archivoPath, comentario || '', estado, existingEntregaId]);
        entregaId = uRes.rows[0].id;

        // Limpiar integrantes previos para sincronizar los actuales
        await client.query('DELETE FROM entrega_integrantes WHERE entrega_id = $1', [entregaId]);
      } else {
        // Insertar nueva entrega
        const insertQ = `
          INSERT INTO entregas (trabajo_id, alumno_id, archivo_nombre, archivo_path, comentario, estado)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        const iRes = await client.query(insertQ, [trabajoId, usuario.id, archivoNombre, archivoPath, comentario || '', estado]);
        entregaId = iRes.rows[0].id;
      }

      // Guardar todos los integrantes en entrega_integrantes
      for (const mId of memberIds) {
        await client.query(
          `INSERT INTO entrega_integrantes (entrega_id, usuario_id) VALUES ($1, $2) ON CONFLICT (entrega_id, usuario_id) DO NOTHING`,
          [entregaId, mId]
        );
      }

      await client.query('COMMIT');

      // Notificaciones en tiempo real a la clase y a todos los integrantes
      emitToClass(trabajo.clase_id, 'assignment.submitted', {
        trabajo_id: Number(trabajoId),
        entrega_id: entregaId,
        alumno_id: usuario.id,
        estado,
        es_grupal: esGrupal,
        integrantes: memberIds
      });

      for (const mId of memberIds) {
        emitToUser(mId, 'assignment.submitted', {
          trabajo_id: Number(trabajoId),
          entrega_id: entregaId,
          estado,
          es_grupal: esGrupal,
          entregado_por: usuario.nombre_completo || usuario.nombre || 'Compañero de grupo'
        });
      }

      return res.status(existingEntregaId ? 200 : 201).json({
        success: true,
        message: esGrupal
          ? `¡Entrega grupal registrada con éxito para ${memberIds.length} integrantes!`
          : 'Trabajo entregado exitosamente'
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error al entregar trabajo:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar la entrega' });
  }
});

// DELETE /api/trabajos/:trabajoId/retirar - Withdraw submission (Student)
router.delete('/trabajos/:trabajoId/retirar', async (req: Request, res: Response) => {
  const { trabajoId } = req.params;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const trabajoQ = await pool.query('SELECT clase_id, tipo_entrega FROM trabajos WHERE id = $1', [trabajoId]);
    if (trabajoQ.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado.' });
    }

    const { permitido, motivo } = await verificarAccesoClase(usuario, trabajoQ.rows[0].clase_id);
    if (!permitido) {
      return res.status(403).json({ error: motivo || 'No perteneces a esta clase.' });
    }

    // Buscar entrega por alumno_id o por ser integrante
    const findQ = `
      SELECT e.id 
      FROM entregas e
      LEFT JOIN entrega_integrantes ei ON ei.entrega_id = e.id
      WHERE e.trabajo_id = $1 AND (e.alumno_id = $2 OR ei.usuario_id = $2)
      LIMIT 1
    `;
    const findRes = await pool.query(findQ, [trabajoId, usuario.id]);
    if (findRes.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró entrega para retirar.' });
    }

    const entregaId = findRes.rows[0].id;
    await pool.query('DELETE FROM entrega_integrantes WHERE entrega_id = $1', [entregaId]);
    await pool.query('DELETE FROM entregas WHERE id = $1', [entregaId]);

    emitToClass(trabajoQ.rows[0].clase_id, 'assignment.withdrawn', {
      trabajo_id: Number(trabajoId),
      entrega_id: entregaId,
      alumno_id: usuario.id
    });

    return res.json({ success: true, message: 'Entrega retirada correctamente' });
  } catch (error) {
    console.error('Error al retirar entrega:', error);
    return res.status(500).json({ error: 'Error al retirar la entrega' });
  }
});

// GET /api/trabajos/:trabajoId/entregas - List all students & submission status for a task (Teacher assigned / Admin)
router.get('/trabajos/:trabajoId/entregas', async (req: Request, res: Response) => {
  const { trabajoId } = req.params;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
    return res.status(403).json({ error: 'No tienes permiso para ver entregas de otros alumnos.' });
  }

  try {
    const trabajoQ = await pool.query('SELECT clase_id FROM trabajos WHERE id = $1', [trabajoId]);
    if (trabajoQ.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado.' });
    }

    const { permitido, motivo } = await verificarAccesoClase(usuario, trabajoQ.rows[0].clase_id);
    if (!permitido) {
      return res.status(403).json({ error: motivo || 'No tienes permisos sobre esta clase.' });
    }

    const query = `
      WITH alumnos_curso AS (
        SELECT DISTINCT u.id_usuario as alumno_id, u.nombre_completo as alumno_nombre, u.correo as alumno_correo
        FROM trabajos t
        JOIN clases c ON t.clase_id = c.id
        JOIN alumnos_clases ac ON LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))
        JOIN usuarios u ON ac.alumno_id = u.id_usuario
        WHERE t.id = $1
        UNION
        SELECT DISTINCT u.id_usuario as alumno_id, u.nombre_completo as alumno_nombre, u.correo as alumno_correo
        FROM entregas e
        JOIN usuarios u ON e.alumno_id = u.id_usuario
        WHERE e.trabajo_id = $1
      )
      SELECT 
        ac.alumno_id,
        ac.alumno_nombre,
        ac.alumno_correo,
        e.id as id,
        e.id as entrega_id,
        e.archivo_nombre,
        e.archivo_path,
        e.comentario,
        COALESCE(e.estado, 'sin_entregar') as estado,
        e.calificacion,
        e.feedback,
        e.fecha_entrega
      FROM alumnos_curso ac
      LEFT JOIN entregas e ON (e.trabajo_id = $1 AND e.alumno_id = ac.alumno_id)
      ORDER BY ac.alumno_nombre ASC
    `;
    const result = await pool.query(query, [trabajoId]);
    return res.json(result.rows || []);
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    return res.status(500).json({ error: 'Error al obtener entregas' });
  }
});

// POST /api/entregas/:id/calificar - Grade submission by submission ID (Teacher assigned / Admin)
router.post('/entregas/:id/calificar', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { calificacion, feedback } = req.body;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
    return res.status(403).json({ error: 'Solo los profesores pueden calificar.' });
  }

  if (calificacion === undefined || calificacion === null) {
    return res.status(400).json({ error: 'La calificación es obligatoria.' });
  }

  try {
    const entregaQ = await pool.query(
      `SELECT e.alumno_id, t.clase_id, t.titulo, t.puntos_max 
       FROM entregas e 
       JOIN trabajos t ON e.trabajo_id = t.id 
       WHERE e.id = $1`,
      [id]
    );

    if (entregaQ.rows.length === 0) {
      return res.status(404).json({ error: 'Entrega no encontrada.' });
    }

    const { permitido, motivo } = await verificarAccesoClase(usuario, entregaQ.rows[0].clase_id);
    if (!permitido) {
      return res.status(403).json({ error: motivo || 'No tienes permisos para calificar en esta clase.' });
    }

    const updateQ = `
      UPDATE entregas 
      SET calificacion = $1, feedback = $2, estado = 'corregido', fecha_calificacion = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    await pool.query(updateQ, [calificacion, feedback || '', id]);

    // Send notification to student
    const { alumno_id, titulo, puntos_max } = entregaQ.rows[0];
    const maxPts = puntos_max || 10;
    try {
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'calificacion', $2, $3, 'entrega', $4)`,
        [alumno_id, `Trabajo calificado: ${titulo}`, `Tu entrega de "${titulo}" fue calificada con ${calificacion}/${maxPts}.`, id]
      );
    } catch (_e) {}

    // Emit real-time events to student and class
    emitToUser(alumno_id, 'assignment.corrected', { entrega_id: Number(id), calificacion: Number(calificacion), feedback });
    emitToUser(alumno_id, 'grade.updated', { alumno_id: Number(alumno_id), calificacion: Number(calificacion) });
    emitToUser(alumno_id, 'performance.updated', { alumno_id: Number(alumno_id) });
    emitToUser(alumno_id, 'notification.created', { tipo: 'calificacion', titulo: `Trabajo calificado: ${titulo}` });
    emitToClass(entregaQ.rows[0].clase_id, 'grade.updated', { entrega_id: Number(id), calificacion: Number(calificacion) });
    emitToClass(entregaQ.rows[0].clase_id, 'performance.updated', { clase_id: entregaQ.rows[0].clase_id });

    return res.json({ success: true, message: 'Calificación guardada exitosamente' });
  } catch (error) {
    console.error('Error al calificar entrega:', error);
    return res.status(500).json({ error: 'Error al calificar la entrega' });
  }
});

// POST /api/trabajos/:trabajoId/alumnos/:alumnoId/calificar - Grade student directly (Teacher assigned / Admin)
router.post('/trabajos/:trabajoId/alumnos/:alumnoId/calificar', async (req: Request, res: Response) => {
  const { trabajoId, alumnoId } = req.params;
  const { calificacion, feedback } = req.body;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
    return res.status(403).json({ error: 'Solo los profesores pueden calificar.' });
  }

  if (calificacion === undefined || calificacion === null) {
    return res.status(400).json({ error: 'La calificación es obligatoria.' });
  }

  try {
    const tQ = await pool.query('SELECT clase_id, titulo, puntos_max FROM trabajos WHERE id = $1', [trabajoId]);
    if (tQ.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado.' });
    }

    const { permitido, motivo } = await verificarAccesoClase(usuario, tQ.rows[0].clase_id);
    if (!permitido) {
      return res.status(403).json({ error: motivo || 'No tienes permisos para calificar en esta clase.' });
    }

    const existingQ = await pool.query('SELECT id FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2', [trabajoId, alumnoId]);
    if (existingQ.rows.length > 0) {
      const updateQ = `
        UPDATE entregas 
        SET calificacion = $1, feedback = $2, estado = 'corregido', fecha_calificacion = CURRENT_TIMESTAMP
        WHERE trabajo_id = $3 AND alumno_id = $4
      `;
      await pool.query(updateQ, [calificacion, feedback || '', trabajoId, alumnoId]);
    } else {
      const insertQ = `
        INSERT INTO entregas (trabajo_id, alumno_id, calificacion, feedback, estado, fecha_calificacion)
        VALUES ($1, $2, $3, $4, 'corregido', CURRENT_TIMESTAMP)
      `;
      await pool.query(insertQ, [trabajoId, alumnoId, calificacion, feedback || '']);
    }

    // Send notification to student
    const titulo = tQ.rows[0]?.titulo || 'Trabajo';
    const maxPts = tQ.rows[0]?.puntos_max || 10;
    try {
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'calificacion', $2, $3, 'trabajo', $4)`,
        [alumnoId, `Trabajo calificado: ${titulo}`, `Has recibido la nota ${calificacion}/${maxPts} en "${titulo}".`, trabajoId]
      );
    } catch (_e) {}

    emitToUser(alumnoId, 'assignment.corrected', { trabajo_id: Number(trabajoId), calificacion: Number(calificacion), feedback });
    emitToUser(alumnoId, 'grade.updated', { alumno_id: Number(alumnoId), calificacion: Number(calificacion) });
    emitToUser(alumnoId, 'performance.updated', { alumno_id: Number(alumnoId) });
    emitToUser(alumnoId, 'notification.created', { tipo: 'calificacion', titulo: `Trabajo calificado: ${titulo}` });
    emitToClass(tQ.rows[0].clase_id, 'grade.updated', { trabajo_id: Number(trabajoId), calificacion: Number(calificacion) });
    emitToClass(tQ.rows[0].clase_id, 'performance.updated', { clase_id: tQ.rows[0].clase_id });

    return res.json({ success: true, message: 'Calificación guardada exitosamente' });
  } catch (error) {
    console.error('Error al calificar al alumno:', error);
    return res.status(500).json({ error: 'Error al calificar al alumno' });
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
