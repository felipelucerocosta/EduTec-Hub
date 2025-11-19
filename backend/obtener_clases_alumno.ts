import { Router, type Request, type Response } from 'express';
import 'express-session';
import pool from './conexion_be'; // Importa el pool de PostgreSQL

// 👇 ESTA DEFINICIÓN DEBE COINCIDIR CON LA DE api_rutas.ts
declare module 'express-session' {
  interface SessionData {
    usuario?: {
      id: number;
      rol?: string;
      [key: string]: any; // 👈 ESTA ES LA LÍNEA QUE FALTABA
    };
  }
}

const router = Router();

router.get('/alumno/mis-clases', async (req: Request, res: Response) => {
  const alumno_id = req.session.usuario?.id;

  if (!alumno_id) {
    return res.status(401).json({ error: 'No has iniciado sesión.' });
  }

  try {
    // Esta consulta une la tabla 'alumnos_clases' con 'clases'
    // para obtener el nombre real de la clase y del profesor (creador)
    const query = `
      SELECT 
        c.nombre, 
        c.materia, 
        c.seccion, 
        c.aula, 
        c.creador, 
        c.codigo
      FROM clases c
      JOIN alumnos_clases ac ON c.codigo = ac.codigo
      WHERE ac.alumno_id = $1
      ORDER BY ac.id DESC
    `;

    const result = await pool.query(query, [alumno_id]);
    
    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener clases del alumno:', error);
    res.status(500).json({ error: 'Error interno al obtener las clases.' });
  }
});

export default router;