import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';
import type { UsuarioSesion } from './permisos';

const router = Router();

router.get('/alumno/mis-clases', async (req: Request, res: Response) => {
  const usuario = req.session?.usuario as UsuarioSesion | undefined;
  const alumno_id = usuario?.id;

  if (!alumno_id) {
    return res.status(401).json({ error: 'No has iniciado sesión.' });
  }

  try {
    // Si el alumno está PENDIENTE → retornar array vacío (sin contenido visible)
    if (usuario?.rol === 'alumno') {
      const estadoQ: any = await pool.query(
        'SELECT estado_acceso FROM usuarios WHERE id_usuario = $1',
        [alumno_id]
      );
      const estado = estadoQ.rows[0]?.estado_acceso || 'PENDIENTE_DE_ASIGNACION';
      if (estado !== 'ACTIVO') {
        try {
          await pool.query(
            `INSERT INTO auditoria_acceso (usuario_id, correo, evento, detalle) VALUES ($1, $2, 'ACCESO_DENEGADO_PENDIENTE', $3)`,
            [alumno_id, usuario.correo || '', `Intento de acceder a clases con estado: ${estado}`]
          );
        } catch (_e) {}
        return res.json([]); // Array vacío
      }
    }

    let query: string;
    let params: any[];

    if (usuario?.rol === 'admin') {
      // Admin ve todas las clases
      query = `
        SELECT DISTINCT
          c.id,
          c.nombre, 
          c.materia, 
          c.seccion, 
          c.aula, 
          c.creador, 
          c.codigo,
          c.titular_id,
          (SELECT COUNT(*) FROM alumnos_clases ac2 WHERE LOWER(TRIM(ac2.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos,
          (SELECT COUNT(*) FROM trabajos t WHERE t.clase_id = c.id) AS total_trabajos
        FROM clases c
        ORDER BY c.id DESC
      `;
      params = [];
    } else {
      // Alumno ACTIVO: solo ve las clases donde esté inscripto
      query = `
        SELECT DISTINCT
          c.id,
          c.nombre, 
          c.materia, 
          c.seccion, 
          c.aula, 
          c.creador, 
          c.codigo,
          c.titular_id,
          (SELECT COUNT(*) FROM alumnos_clases ac2 WHERE LOWER(TRIM(ac2.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos,
          (SELECT COUNT(*) FROM trabajos t WHERE t.clase_id = c.id) AS total_trabajos
        FROM clases c
        INNER JOIN alumnos_clases ac ON LOWER(TRIM(c.codigo)) = LOWER(TRIM(ac.codigo))
        WHERE ac.alumno_id = $1
        ORDER BY c.id DESC
      `;
      params = [alumno_id];
    }

    const result = await pool.query(query, params);
    return res.json(result.rows || []);
  } catch (error) {
    console.error('Error al obtener clases del alumno:', error);
    return res.status(500).json({ error: 'Error interno al obtener las clases.' });
  }
});

export default router;