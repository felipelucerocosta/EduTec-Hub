import { Router, type Request, type Response } from 'express';
import 'express-session';
import pool from './conexion_pg';

// Ampliar el tipo de sesión para que TypeScript reconozca req.session.usuario
declare module 'express-session' {
  interface SessionData {
    usuario?: {
      id: number;
      nombre?: string;
      correo?: string;
      rol?: string;
      [key: string]: any;
    };
  }
}

const router = Router();

router.get('/profesor/mis-clases', async (req: Request, res: Response) => {
  const usuario = req.session?.usuario;

  const nombre_profesor = usuario?.nombre || '';
  const user_id = usuario?.id || 0;

  try {
    // Buscamos las clases donde el creador sea este profesor (por ID o por nombre) o sean del secundario por defecto
    const query = `
      SELECT * FROM clases 
      WHERE creador_id = $1 
         OR (creador = $2 AND creador IS NOT NULL AND creador != '') 
         OR seccion = 'Secundario' 
      ORDER BY id DESC
    `;
    const result = await pool.query(query, [user_id, nombre_profesor]);
    
    return res.json(result.rows || []);
  } catch (error) {
    console.error('Error al obtener clases del profesor:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;