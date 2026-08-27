import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();

// GET /api/clases - Obtener lista de clases con la cantidad real de alumnos inscriptos
router.get('/clases', async (_req: Request, res: Response) => {
  const sql = `
    SELECT 
      c.id, 
      c.nombre, 
      c.seccion, 
      c.materia, 
      c.aula, 
      c.creador, 
      c.codigo,
      (SELECT COUNT(*) FROM alumnos_clases ac WHERE ac.codigo = c.codigo) AS cantidad_alumnos
    FROM clases c
    ORDER BY c.id DESC
  `;

  try {
    const result = await pool.query(sql);
    const rows = result && result.rows ? result.rows : [];
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al consultar clases:', err);
    return res.json([]);
  }
});

export default router;