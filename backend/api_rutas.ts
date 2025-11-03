// --- 1. LÍNEAS DE IMPORTACIÓN CORREGIDAS ---
import { Router, Request, Response } from 'express'; // Usamos import
import 'express-session';         // Importamos para los tipos de sesión
import pool from './conexion_be';  // Importamos el pool de PostgreSQL
import multer from 'multer';       // Importamos multer

// --- 2. EL RESTO DE TU CÓDIGO (SIN CAMBIOS) ---
const storage = multer.diskStorage({
  destination: function (_req: any, _file: any, cb: any) {
    cb(null, 'uploads/');
  },
  filename: function (_req: any, file: any, cb: any) {
    cb(null, Date.now() + '-' + (file.originalname || 'file'));
  }
});
const upload = multer({ storage });


declare module 'express-session' {
  interface SessionData {
    usuario?: {
      id: number;
      rol?: string;
      [key: string]: any;
    };
  }
}

const router = Router(); // <-- Esto ahora funcionará correctamente

// ======================================================
// 1. CALENDARIO
// ======================================================

// Obtener todas las notas del calendario para el usuario que ha iniciado sesión
router.get('/calendario/notas', async (req: Request, res: Response) => { // Tipos mejorados
  const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : null;

  if (!id_usuario) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    const query = `SELECT * FROM calendario_notas WHERE id_usuario = $1 ORDER BY fecha_evento ASC`;
    const result = await pool.query(query, [id_usuario]); // <-- pool.query ahora funcionará
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener notas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Crear una nueva nota
router.post('/calendario/notas', async (req: Request, res: Response) => {
  const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : null;
  if (!id_usuario) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  const { titulo, descripcion, fecha_evento } = req.body;
  if (!titulo || !fecha_evento) {
    return res.status(400).json({ message: 'El título y la fecha son obligatorios.' });
  }

  try {
    const query = `
      INSERT INTO calendario_notas (id_usuario, titulo, descripcion, fecha_evento)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [id_usuario, titulo, descripcion, fecha_evento]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear nota:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Eliminar una nota
router.delete('/calendario/notas/:id', async (req: Request, res: Response) => {
  const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : null;
  const { id } = req.params;

  if (!id_usuario) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    const query = `DELETE FROM calendario_notas WHERE id_nota = $1 AND id_usuario = $2 RETURNING *`;
    const result = await pool.query(query, [id, id_usuario]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Nota no encontrada o no pertenece al usuario.' });
    }
    res.status(200).json({ message: 'Nota eliminada' });
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ======================================================
// 2. SUBIR ACTAS (usando Multer)
// ======================================================
router.post('/subir-acta', upload.single('acta'), async (req: Request, res: Response) => {

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se envió ningún archivo (campo "acta").' });
  }

  // Crear tabla si no existe
  await pool.query(`
    CREATE TABLE IF NOT EXISTS actas (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      originalname TEXT NOT NULL,
      path TEXT NOT NULL,
      mimetype TEXT,
      size BIGINT,
      uploaded_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const { filename, originalname, path: filepath, mimetype, size } = req.file;

  // Buscar si ya existe una acta con el mismo nombre original
  const existing = await pool.query('SELECT id FROM actas WHERE originalname = $1 LIMIT 1', [originalname]);
  if (existing.rows && existing.rows.length > 0) {
    return res.status(200).json({ success: true, message: 'Acta ya existe', id: existing.rows[0].id });
  }

  // Insertar registro de la acta
  const insertQ = `
    INSERT INTO actas (filename, originalname, path, mimetype, size)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  const result = await pool.query(insertQ, [filename, originalname, filepath, mimetype, size]);
  const insertedId = result.rows[0]?.id ?? null;

  return res.status(201).json({ success: true, message: 'Acta subida e info guardada.', id: insertedId });
});

// --- 3. LÍNEA DE EXPORTACIÓN CORREGIDA ---
export default router;