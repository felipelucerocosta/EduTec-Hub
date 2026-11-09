import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';
import type { UsuarioSesion } from './permisos';

const router = Router();

router.get('/profesor/mis-clases', async (req: Request, res: Response) => {
  const usuario = req.session?.usuario as UsuarioSesion | undefined;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  const user_id = usuario.id;
  const es_admin = usuario.rol === 'admin' || usuario.isAdmin;

  try {
    let query: string;
    let params: any[];

    if (es_admin) {
      // Admin ve todas las clases con conteos
      query = `
        SELECT 
          c.id, 
          c.nombre, 
          c.seccion, 
          c.materia, 
          c.aula, 
          c.creador, 
          c.codigo,
          c.titular_id,
          (SELECT COUNT(*) FROM alumnos_clases ac WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos,
          (SELECT COUNT(*) FROM trabajos t WHERE t.clase_id = c.id) AS total_trabajos
        FROM clases c 
        ORDER BY c.id DESC
      `;
      params = [];
    } else {
      // Profesor solo ve clases donde esté explícitamente asignado como titular o en profesores_clases
      query = `
        SELECT DISTINCT
          c.id, 
          c.nombre, 
          c.seccion, 
          c.materia, 
          c.aula, 
          c.creador, 
          c.codigo,
          c.titular_id,
          (SELECT COUNT(*) FROM alumnos_clases ac WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos,
          (SELECT COUNT(*) FROM trabajos t WHERE t.clase_id = c.id) AS total_trabajos
        FROM clases c 
        LEFT JOIN profesores_clases pc ON pc.clase_id = c.id
        WHERE c.titular_id = $1 OR pc.profesor_id = $1
        ORDER BY c.id DESC
      `;
      params = [user_id];
    }

    const result = await pool.query(query, params);
    return res.json(result.rows || []);
  } catch (error) {
    console.error('Error al obtener clases del profesor:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;