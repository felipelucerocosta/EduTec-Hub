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
    // Si el alumno está en estado PENDIENTE, verificar si ya se le asignaron clases
    if (usuario?.rol === 'alumno') {
      const estadoQ: any = await pool.query(
        'SELECT estado_acceso FROM usuarios WHERE id_usuario = $1',
        [alumno_id]
      );
      const estado = estadoQ.rows[0]?.estado_acceso || 'PENDIENTE_DE_ASIGNACION';

      // Cuentas explícitamente suspendidas o inactivas no ven contenido
      if (estado === 'SUSPENDIDO' || estado === 'INACTIVO') {
        try {
          await pool.query(
            `INSERT INTO auditoria_acceso (usuario_id, correo, evento, detalle) VALUES ($1, $2, 'ACCESO_DENEGADO_SUSPENDIDO', $3)`,
            [alumno_id, usuario.correo || '', `Intento de acceder a clases con estado: ${estado}`]
          );
        } catch (_e) {}
        return res.json([]);
      }

      if (estado !== 'ACTIVO') {
        // Verificar si ya fue inscripto en alguna clase
        const countQ: any = await pool.query(
          'SELECT COUNT(*) as total FROM alumnos_clases WHERE alumno_id = $1',
          [alumno_id]
        );
        const total = Number(countQ?.rows?.[0]?.total || 0);
        if (total > 0) {
          // Ya tiene clases asignadas por Administración: auto-regularizar a ACTIVO
          try {
            await pool.query("UPDATE usuarios SET estado_acceso = 'ACTIVO' WHERE id_usuario = $1", [alumno_id]);
          } catch (_e) {}
        } else {
          // Realmente no tiene clases asignadas aún
          return res.json([]);
        }
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