import { Router, Request, Response } from 'express';
import 'express-session';
import pool from './conexion_be';
import multer from 'multer';
import path from 'path';

// Configuración de Multer
const storage = multer.diskStorage({
  destination: function (_req: any, _file: any, cb: any) {
    // Asegúrate de que esta carpeta exista o Render falle
    cb(null, 'uploads/');
  },
  filename: function (_req: any, file: any, cb: any) {
    cb(null, Date.now() + '-' + (file.originalname || 'file'));
  }
});
const upload = multer({ storage });

// Extender tipos de sesión para TypeScript
declare module 'express-session' {
  interface SessionData {
    usuario?: {
      id: number;
      rol?: string;
      nombre?: string;
      [key: string]: any;
    };
  }
}

const router = Router();

// ======================================================
// 1. CALENDARIO (Adaptado a SQLite)
// ======================================================

router.get('/calendario/notas', async (req: Request, res: Response) => { 
  const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : null;

  if (!id_usuario) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    const query = `SELECT * FROM calendario_notas WHERE id_usuario = $1 ORDER BY fecha_evento ASC`;
    const result = await pool.query(query, [id_usuario]); 
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener notas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

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
    // SQLite: Quitamos RETURNING * para evitar errores
    const query = `
      INSERT INTO calendario_notas (id_usuario, titulo, descripcion, fecha_evento)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [id_usuario, titulo, descripcion, fecha_evento]);
    
    // Devolvemos lo que insertamos manualmente
    res.status(201).json({ 
        id_usuario, titulo, descripcion, fecha_evento, success: true 
    });
  } catch (error) {
    console.error('Error al crear nota:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.delete('/calendario/notas/:id', async (req: Request, res: Response) => {
  const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : null;
  const { id } = req.params;

  if (!id_usuario) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    // SQLite: Quitamos RETURNING *
    const query = `DELETE FROM calendario_notas WHERE id_nota = $1 AND id_usuario = $2`;
    await pool.query(query, [id, id_usuario]);

    res.status(200).json({ message: 'Nota eliminada' });
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ======================================================
// 2. SUBIR ACTAS (Adaptado a SQLite)
// ======================================================
router.post('/subir-acta', upload.single('acta'), async (req: Request, res: Response) => {

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se envió ningún archivo (campo "acta").' });
  }

  const { filename, originalname, path: filepath, mimetype, size } = req.file;

  try {
    // SQLite: Quitamos RETURNING id
    const insertQ = `
        INSERT INTO actas (filename, originalname, path, mimetype, size)
        VALUES ($1, $2, $3, $4, $5)
    `;
    const result: any = await pool.query(insertQ, [filename, originalname, filepath, mimetype, size]);
    
    // En el pool simulado de SQLite, result.insertId tiene el ID generado
    const insertedId = result.insertId; 

    return res.status(201).json({ success: true, message: 'Acta subida e info guardada.', id: insertedId });
  } catch (error) {
      console.error("Error subiendo acta:", error);
      return res.status(500).json({ success: false, message: "Error interno" });
  }
});

// LISTAR ACTAS
router.get('/actas', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM actas ORDER BY uploaded_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar actas' });
  }
});

// DESCARGAR ACTAS
router.get('/actas/descargar/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM actas WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Acta no encontrada' });
    }

    const fileData = result.rows[0];
    // Ajuste de ruta para Render/Local. __dirname es backend/, '..' sube a raiz, luego entra a uploads
    const filePath = path.join(__dirname, '..', fileData.path); 

    res.download(filePath, fileData.originalname, (err) => {
        if (err) {
            console.error("Error al descargar:", err);
            if (!res.headersSent) {
                res.status(500).send("Error al descargar el archivo.");
            }
        }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al procesar la descarga' });
  }
});

// ======================================================
// 3. LOGOUT (Solución al error TS2339 y tipos any)
// ======================================================
router.post('/logout', (req: Request, res: Response) => {
  // TypeScript no ve 'destroy' en SessionData por defecto, casteamos a 'any'
  (req.session as any).destroy((err: any) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.status(500).json({ message: 'No se pudo cerrar la sesión' });
    }
    res.clearCookie('connect.sid'); 
    return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
  });
});

export default router;
