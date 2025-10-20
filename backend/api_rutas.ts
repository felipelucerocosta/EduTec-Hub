const { Router } = require('express');
require('express-session');
const pool = require('./conexion_be');

// usar require para multer (evita problemas con módulos en tiempo de ejecución)
const multer = require('multer');

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

const router = Router();

// ======================================================
// 1. CALENDARIO
// ======================================================

// Obtener todas las notas del calendario para el usuario que ha iniciado sesión
router.get('/calendario/notas', async (req: any, res: any) => {
  const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : null;

  if (!id_usuario) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    const query = `SELECT * FROM calendario_notas WHERE id_usuario = $1;`;
    const { rows } = await pool.query(query, [id_usuario]);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error al obtener notas del calendario:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.post('/calendario/notas', async (req: any, res: any) => {
  const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : null;
  const { titulo, descripcion, fecha_evento } = req.body as {
    titulo?: string;
    descripcion?: string;
    fecha_evento?: string;
  };

  if (!id_usuario) {
    return res.status(401).json({ message: 'No autorizado. Por favor, inicie sesión.' });
  }
  if (!titulo || !fecha_evento) {
    return res.status(400).json({ message: 'El título y la fecha son obligatorios.' });
  }

  try {
    const query = `
      INSERT INTO calendario_notas (id_usuario, titulo, descripcion, fecha_evento)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const { rows } = await pool.query(query, [id_usuario, titulo, descripcion, fecha_evento]);
    res.status(201).json({ message: 'Nota del calendario guardada exitosamente.', nota: rows[0] });
  } catch (err) {
    console.error('Error al guardar nota del calendario:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ======================================================
// 2. NOTAS DEL PROFESOR
// ======================================================
router.post('/profesor/notas', async (req: any, res: any) => {
  const id_profesor = req.session.usuario ? Number(req.session.usuario.id) : null;
  const { titulo, contenido } = req.body as { titulo?: string; contenido?: string };

  if (!id_profesor || req.session.usuario?.rol !== 'profesor') {
    return res.status(403).json({ message: 'Acción no permitida.' });
  }

  try {
    const query = `
      INSERT INTO notas_profesor (id_profesor, titulo, contenido)
      VALUES ($1, $2, $3) RETURNING *;
    `;
    const { rows } = await pool.query(query, [id_profesor, titulo, contenido]);
    res.status(201).json({ message: 'Nota subida exitosamente.', nota: rows[0] });
  } catch (err) {
    console.error('Error al subir nota del profesor:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ======================================================
// 3. TRABAJOS Y MATERIALES DEL PROFESOR
// ======================================================

// Ruta para subir materiales (archivos)
router.post('/profesor/materiales', upload.single('archivo'), async (req: any, res: any) => {
  const id_profesor = req.session.usuario ? Number(req.session.usuario.id) : null;
  const { titulo, descripcion } = req.body as { titulo?: string; descripcion?: string };
  const ruta_archivo = req.file?.path ?? null;

  if (!id_profesor || req.session.usuario?.rol !== 'profesor') {
    return res.status(403).json({ message: 'Acción no permitida.' });
  }
  if (!ruta_archivo) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
  }

  try {
    const query = `
      INSERT INTO materiales (id_profesor, titulo, descripcion, ruta_archivo)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const { rows } = await pool.query(query, [id_profesor, titulo, descripcion, ruta_archivo]);
    res.status(201).json({ message: 'Material subido exitosamente.', material: rows[0] });
  } catch (err) {
    console.error('Error al subir material:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Ruta para crear un trabajo (asignación)
router.post('/profesor/trabajos', async (req: any, res: any) => {
  const id_profesor = req.session.usuario ? Number(req.session.usuario.id) : null;
  const { titulo, descripcion, fecha_entrega } = req.body as {
    titulo?: string;
    descripcion?: string;
    fecha_entrega?: string;
  };

  if (!id_profesor || req.session.usuario?.rol !== 'profesor') {
    return res.status(403).json({ message: 'Acción no permitida.' });
  }

  try {
    const query = `
      INSERT INTO trabajos (id_profesor, titulo, descripcion, fecha_entrega)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const { rows } = await pool.query(query, [id_profesor, titulo, descripcion, fecha_entrega]);
    res.status(201).json({ message: 'Trabajo creado exitosamente.', trabajo: rows[0] });
  } catch (err) {
    console.error('Error al crear trabajo:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ======================================================
// 4. CALIFICACIÓN DE TRABAJOS
// ======================================================
router.put('/trabajos/calificar/:id_entrega', async (req: any, res: any) => {
  const id_profesor = req.session.usuario ? Number(req.session.usuario.id) : null;
  const { id_entrega } = req.params;
  const { calificacion, comentario_profesor } = req.body as { calificacion?: number; comentario_profesor?: string };

  if (!id_profesor || req.session.usuario?.rol !== 'profesor') {
    return res.status(403).json({ message: 'Acción no permitida.' });
  }
  if (calificacion === undefined) {
    return res.status(400).json({ message: 'La calificación es obligatoria.' });
  }

  try {
    const query = `
      UPDATE entregas
      SET calificacion = $1, comentario_profesor = $2
      WHERE id = $3
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [calificacion, comentario_profesor, id_entrega]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró la entrega especificada.' });
    }

    res.status(200).json({ message: 'Trabajo calificado exitosamente.', entrega: rows[0] });
  } catch (err) {
    console.error('Error al calificar trabajo:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Ruta para subir acta, guardarla en disco y registrar en BD
router.post('/actas/upload', upload.single('acta'), async (req: any, res: any) => {
  try {
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

    return res.status(201).json({ success: true, message: 'Acta guardada', id: insertedId });
  } catch (err) {
    console.error('Error subiendo acta:', err);
    return res.status(500).json({ success: false, message: 'Error interno al subir acta.' });
  }
});

module.exports = router;