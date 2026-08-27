import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();

router.get('/alumno/mis-clases', async (req: Request, res: Response) => {
  const alumno_id = req.session.usuario?.id;

  if (!alumno_id) {
    return res.status(401).json({ error: 'No has iniciado sesión.' });
  }

  try {
    const query = `
      SELECT DISTINCT
        c.id,
        c.nombre, 
        c.materia, 
        c.seccion, 
        c.aula, 
        c.creador, 
        c.codigo,
        (SELECT COUNT(*) FROM alumnos_clases ac2 WHERE ac2.codigo = c.codigo) AS cantidad_alumnos
      FROM clases c
      LEFT JOIN alumnos_clases ac ON c.codigo = ac.codigo
      WHERE ac.alumno_id = $1 OR c.seccion = 'Secundario'
      ORDER BY c.id DESC
    `;

    const result = await pool.query(query, [alumno_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener clases del alumno:', error);
    res.status(500).json({ error: 'Error interno al obtener las clases.' });
  }
});

export default router;