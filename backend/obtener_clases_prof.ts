import { Router, type Request, type Response } from 'express';
import 'express-session';
import pool from './conexion_be';

const router = Router();

router.get('/profesor/mis-clases', async (req: Request, res: Response) => {
  // Asumimos que el profesor inició sesión
  // Si guardas el nombre del creador en la tabla clases, usamos eso.
  // Si guardas el ID, usamos el ID. Basado en tu código anterior, usas el nombre 'creador'.
  
  const nombre_profesor = req.session.usuario?.nombre; // Asegúrate que al login guardes el nombre

  if (!nombre_profesor) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  try {
    // Buscamos las clases donde el creador sea este profesor
    const query = 'SELECT * FROM clases WHERE creador = $1 ORDER BY id DESC';
    const result = await pool.query(query, [nombre_profesor]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener clases del profesor:', error);
    res.status(500).json({ error: 'Error interno.' });
  }
});

export default router;