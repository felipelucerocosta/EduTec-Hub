// --- 1. LÍNEAS DE IMPORTACIÓN CORREGIDAS ---
import { Router, Request, Response } from 'express'; // Usamos import
import path from 'path';
import 'express-session';         // Importamos para los tipos de sesión
import pool from './conexion_be';  // Importamos el pool de PostgreSQL
import * as multer from 'multer';     // Importamos multer
import session from 'express-session';
import router from './api_rutas'; // Asegúrate de que este es tu archivo de rutas  

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
router.get('/calendario/notas', async (req: Request, res: Response) => {
  const id_usuario = req.session.usuario? Number(req.session.usuario.id) : null;

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

router.get('/actas', async (req: Request, res: Response) => {
  try {
    // Seleccionamos las actas de la base de datos
    const result = await pool.query('SELECT * FROM actas ORDER BY uploaded_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar actas' });
  }
});

// 2. DESCARGAR UNA ACTA
router.get('/actas/descargar/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM actas WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Acta no encontrada' });
    }

    const fileData = result.rows[0];
    // Construimos la ruta real del archivo en el servidor
    const filePath = path.join(__dirname, '..', fileData.path); // '..' porque estamos en backend/ y uploads/ está en la raíz o dentro de backend

    res.download(filePath, fileData.originalname); // Esto inicia la descarga en el navegador
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al descargar' });
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
// ======================================================
// 2. SUBIR ACTAS (usando Multer) - SOLO PROFESORES

// Middleware simple para requerir rol 'profesor'
function requireProfesor(req: Request, res: Response, next: any) {
  const rol = (req.session as any)?.usuario?.rol || (req.session as any)?.rol;
  if (rol && rol === 'profesor') return next();
  return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere rol de profesor.' });
}

router.post('/subir-acta', requireProfesor, upload.single('acta'), async (req: Request, res: Response) => {

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

// ======================================================
// RUTAS DE CAMPUS: solicitudes y aprobaciones entre profesores

// Crear tabla ligera para gestionar solicitudes de acceso
const initCampusTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campus_accesos (
      id SERIAL PRIMARY KEY,
      profesor_id INTEGER NOT NULL,
      clase_id INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      solicitado_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

router.post('/campus/solicitar', async (req: Request, res: Response) => {
  // Profesor solicita acceso a un campus/clase
  const profesor_id = (req.session as any)?.usuario?.id;
  const clase_id = Number(req.body.clase_id || 0);
  if (!profesor_id) return res.status(401).json({ error: 'Debes iniciar sesión.' });
  if (!clase_id) return res.status(400).json({ error: 'Falta clase_id.' });

  try {
    await initCampusTables();
    // Evitar solicitudes duplicadas
    const existe = await pool.query('SELECT id FROM campus_accesos WHERE profesor_id=$1 AND clase_id=$2 LIMIT 1', [profesor_id, clase_id]);
    if (existe.rows && existe.rows.length > 0) return res.status(200).json({ message: 'Solicitud ya registrada.' });

    await pool.query('INSERT INTO campus_accesos (profesor_id, clase_id, estado) VALUES ($1,$2,$3)', [profesor_id, clase_id, 'pendiente']);
    return res.json({ success: true, message: 'Solicitud enviada.' });
  } catch (err) {
    console.error('Error solicitar acceso campus:', err);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

router.post('/campus/aprobar', requireProfesor, async (req: Request, res: Response) => {
  // Titular aprueba una solicitud. Se requiere que el profesor que aprueba sea titular de la clase.
  const aprobador_id = (req.session as any)?.usuario?.id;
  const solicitud_id = Number(req.body.solicitud_id || 0);
  if (!aprobador_id) return res.status(401).json({ error: 'Debes iniciar sesión.' });
  if (!solicitud_id) return res.status(400).json({ error: 'Falta solicitud_id.' });

  try {
    // Obtener solicitud
    const sol = await pool.query('SELECT * FROM campus_accesos WHERE id=$1 LIMIT 1', [solicitud_id]);
    if (!sol.rows || sol.rows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    const fila = sol.rows[0];

    // Obtener la clase y verificar titular
    const claseRes = await pool.query('SELECT titular_id FROM clases WHERE id=$1 LIMIT 1', [fila.clase_id]);
    const titular_id = claseRes.rows && claseRes.rows[0] ? claseRes.rows[0].titular_id : null;
    if (titular_id !== aprobador_id) return res.status(403).json({ error: 'Solo el titular puede aprobar solicitudes.' });

    // Aprobar
    await pool.query('UPDATE campus_accesos SET estado=$1 WHERE id=$2', ['aprobado', solicitud_id]);

    // (Opcional) agregar relación profesor-clase en una tabla profesores_clases
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profesores_clases (
        id SERIAL PRIMARY KEY,
        profesor_id INTEGER NOT NULL,
        clase_id INTEGER NOT NULL,
        agregado_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query('INSERT INTO profesores_clases (profesor_id, clase_id) VALUES ($1,$2)', [fila.profesor_id, fila.clase_id]);

    return res.json({ success: true, message: 'Solicitud aprobada.' });
  } catch (err) {
    console.error('Error aprobar solicitud campus:', err);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

// Listar solicitudes pendientes para una clase (titular puede ver)
router.get('/campus/solicitudes/:clase_id', requireProfesor, async (req: Request, res: Response) => {
  const clase_id = Number(req.params.clase_id || 0);
  const requester_id = (req.session as any)?.usuario?.id;
  if (!requester_id) return res.status(401).json({ error: 'Debes iniciar sesión.' });

  try {
    // verificar que requester es titular
    const claseRes = await pool.query('SELECT titular_id FROM clases WHERE id=$1 LIMIT 1', [clase_id]);
    const titular_id = claseRes.rows && claseRes.rows[0] ? claseRes.rows[0].titular_id : null;
    if (titular_id !== requester_id) return res.status(403).json({ error: 'Solo el titular puede ver las solicitudes.' });

    const pendientes = await pool.query('SELECT * FROM campus_accesos WHERE clase_id=$1 AND estado=$2 ORDER BY solicitado_at ASC', [clase_id, 'pendiente']);
    return res.json({ success: true, solicitudes: pendientes.rows });
  } catch (err) {
    console.error('Error listar solicitudes:', err);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

// ======================================================
// RUTA DE CALIFICAR (PROTEGIDA: solo profesores con acceso a la clase)
// Ejemplo: POST /api/calificar { clase_id, alumno_id, trabajo_id, nota }

async function profesorTieneAcceso(profesor_id: number, clase_id: number) {
  const r = await pool.query('SELECT id FROM profesores_clases WHERE profesor_id=$1 AND clase_id=$2 LIMIT 1', [profesor_id, clase_id]);
  return r.rows && r.rows.length > 0;
}

router.post('/calificar', requireProfesor, async (req: Request, res: Response) => {
  const profesor_id = (req.session as any)?.usuario?.id;
  const clase_id = Number(req.body.clase_id || 0);
  const alumno_id = Number(req.body.alumno_id || 0);
  const trabajo_id = Number(req.body.trabajo_id || 0);
  const nota = Number(req.body.nota ?? NaN);

  if (!profesor_id) return res.status(401).json({ error: 'Debes iniciar sesión.' });
  if (!clase_id || !alumno_id || !trabajo_id || Number.isNaN(nota)) return res.status(400).json({ error: 'Datos incompletos.' });

  try {
    // verificar acceso
    const tiene = await profesorTieneAcceso(profesor_id, clase_id);
    if (!tiene) return res.status(403).json({ error: 'No tienes permiso para calificar en esta clase.' });

    // crear tabla de notas si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calificaciones (
        id SERIAL PRIMARY KEY,
        clase_id INTEGER NOT NULL,
        trabajo_id INTEGER NOT NULL,
        alumno_id INTEGER NOT NULL,
        profesor_id INTEGER NOT NULL,
        nota NUMERIC,
        fecha TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query('INSERT INTO calificaciones (clase_id, trabajo_id, alumno_id, profesor_id, nota) VALUES ($1,$2,$3,$4,$5)', [clase_id, trabajo_id, alumno_id, profesor_id, nota]);
    return res.json({ success: true, message: 'Calificación registrada.' });
  } catch (err) {
    console.error('Error al calificar:', err);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

// Endpoint para verificar si el profesor en sesión tiene acceso a la clase
router.get('/campus/has-access/:clase_id', requireProfesor, async (req: Request, res: Response) => {
  const profesor_id = (req.session as any)?.usuario?.id;
  const clase_id = Number(req.params.clase_id || 0);
  if (!profesor_id) return res.status(401).json({ error: 'Debes iniciar sesión.' });
  if (!clase_id) return res.status(400).json({ error: 'Falta clase_id.' });

  try {
    // Aseguramos existencia de la tabla profesores_clases
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profesores_clases (
        id SERIAL PRIMARY KEY,
        profesor_id INTEGER NOT NULL,
        clase_id INTEGER NOT NULL,
        agregado_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const r = await pool.query('SELECT id FROM profesores_clases WHERE profesor_id=$1 AND clase_id=$2 LIMIT 1', [profesor_id, clase_id]);
    const tiene = r.rows && r.rows.length > 0;
    return res.json({ access: tiene });
  } catch (err) {
    console.error('Error checking access:', err);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

// Batch check access: POST { clase_ids: [1,2,3] } -> { access: { '1': true, '2': false } }
router.post('/campus/has-access-batch', requireProfesor, async (req: Request, res: Response) => {
  const profesor_id = (req.session as any)?.usuario?.id;
  const clase_ids: number[] = Array.isArray(req.body.clase_ids) ? req.body.clase_ids.map((v: any) => Number(v)) : [];
  if (!profesor_id) return res.status(401).json({ error: 'Debes iniciar sesión.' });
  if (!clase_ids.length) return res.status(400).json({ error: 'Falta clase_ids.' });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profesores_clases (
        id SERIAL PRIMARY KEY,
        profesor_id INTEGER NOT NULL,
        clase_id INTEGER NOT NULL,
        agregado_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const placeholders = clase_ids.map((_, i) => `$${i + 1}`).join(',');
    const query = `SELECT clase_id FROM profesores_clases WHERE profesor_id = $${clase_ids.length + 1} AND clase_id IN (${placeholders})`;
    const params = [...clase_ids, profesor_id];
    const result = await pool.query(query, params);
    const granted = new Set(result.rows.map((r: any) => Number(r.clase_id)));
    const accessMap: Record<number, boolean> = {};
    clase_ids.forEach((id) => { accessMap[id] = granted.has(id); });
    return res.json({ access: accessMap });
  } catch (err) {
    console.error('Error in has-access-batch:', err);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

// --- 3. LÍNEA DE EXPORTACIÓN CORREGIDA ---
// Ruta simple para obtener información del usuario en sesión
router.get('/whoami', (req: Request, res: Response) => {
  const usuario = (req.session as any)?.usuario;
  if (!usuario) return res.json({ user: null });
  // devolver solo los campos necesarios
  const safe = {
    id: usuario.id,
    rol: usuario.rol,
    nombre: usuario.nombre || usuario.nombre_completo || null
  };
  return res.json({ user: safe });
});

// Logout: destruir sesión
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ success: false, error: 'Error cerrando sesión.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

export default router;
