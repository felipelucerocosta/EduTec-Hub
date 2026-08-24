import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();

const getUserId = (req: Request) => req.session?.usuario?.id;
const getUserRol = (req: Request) => req.session?.usuario?.rol;

// ─────────────────────────────────────────────────────────────
// GET /api/rendimiento/alumno
// Rendimiento completo del alumno logueado (todas sus clases)
// ─────────────────────────────────────────────────────────────
router.get('/rendimiento/alumno', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  try {
    // Obtener todas las clases del alumno
    const clasesQ = `
      SELECT c.id, c.nombre, c.materia, c.codigo
      FROM clases c
      JOIN alumnos_clases ac ON ac.codigo = c.codigo
      WHERE ac.alumno_id = $1
    `;
    const clasesRes = await pool.query(clasesQ, [userId]);
    const clases = clasesRes.rows;

    if (clases.length === 0) {
      return res.json({ materias: [], resumen: { promedio_general: null, total_trabajos: 0, total_entregados: 0, total_pendientes: 0 } });
    }

    const materias: any[] = [];

    for (const clase of clases) {
      // Trabajos de esta clase
      const trabajosQ = `SELECT id, titulo, fecha_limite, fecha_creacion FROM trabajos WHERE clase_id = $1 ORDER BY fecha_creacion ASC`;
      const trabajosRes = await pool.query(trabajosQ, [clase.id]);
      const trabajos = trabajosRes.rows;

      // Entregas del alumno en esta clase
      const entregasQ = `
        SELECT e.trabajo_id, e.estado, e.calificacion, e.fecha_entrega, e.fecha_calificacion, e.feedback
        FROM entregas e
        JOIN trabajos t ON t.id = e.trabajo_id
        WHERE t.clase_id = $1 AND e.alumno_id = $2
      `;
      const entregasRes = await pool.query(entregasQ, [clase.id, userId]);
      const entregasMap = new Map(entregasRes.rows.map((e: any) => [e.trabajo_id, e]));

      let calificadas: number[] = [];
      let entregados = 0;
      let pendientes = 0;
      let enCorreccion = 0;
      let fueraDeTiempo = 0;

      const trabajosDetalle = trabajos.map((t: any) => {
        const entrega = entregasMap.get(t.id);
        let estadoFinal = 'sin_entregar';
        if (entrega) {
          estadoFinal = entrega.estado;
          if (entrega.estado === 'corregido' && entrega.calificacion !== null && entrega.calificacion !== undefined) {
            calificadas.push(Number(entrega.calificacion));
            entregados++;
          } else if (entrega.estado === 'entregado') {
            enCorreccion++;
            entregados++;
          } else if (entrega.estado === 'entrega_tardia') {
            fueraDeTiempo++;
            entregados++;
          } else {
            entregados++;
          }
        } else {
          const now = new Date();
          const esPasado = t.fecha_limite && new Date(t.fecha_limite) < now;
          estadoFinal = esPasado ? 'vencido' : 'sin_entregar';
          pendientes++;
        }
        return {
          id: t.id,
          titulo: t.titulo,
          fecha_limite: t.fecha_limite,
          estado: estadoFinal,
          calificacion: entrega?.calificacion ?? null,
          feedback: entrega?.feedback ?? null,
          fecha_entrega: entrega?.fecha_entrega ?? null,
        };
      });

      const promedio = calificadas.length > 0
        ? Math.round((calificadas.reduce((a, b) => a + b, 0) / calificadas.length) * 10) / 10
        : null;

      const porcentajeEntregas = trabajos.length > 0
        ? Math.round((entregados / trabajos.length) * 100)
        : 0;

      materias.push({
        clase_id: clase.id,
        nombre: clase.nombre,
        materia: clase.materia,
        promedio,
        total_trabajos: trabajos.length,
        entregados,
        pendientes,
        en_correccion: enCorreccion,
        fuera_de_tiempo: fueraDeTiempo,
        calificados: calificadas.length,
        porcentaje_entregas: porcentajeEntregas,
        trabajos: trabajosDetalle,
      });
    }

    // Resumen general
    const promediosValidos = materias.filter(m => m.promedio !== null).map(m => m.promedio);
    const promedio_general = promediosValidos.length > 0
      ? Math.round((promediosValidos.reduce((a: number, b: number) => a + b, 0) / promediosValidos.length) * 10) / 10
      : null;

    const resumen = {
      promedio_general,
      total_trabajos: materias.reduce((a, m) => a + m.total_trabajos, 0),
      total_entregados: materias.reduce((a, m) => a + m.entregados, 0),
      total_pendientes: materias.reduce((a, m) => a + m.pendientes, 0),
      total_calificados: materias.reduce((a, m) => a + m.calificados, 0),
    };

    return res.json({ materias, resumen });
  } catch (error) {
    console.error('Error rendimiento alumno:', error);
    return res.status(500).json({ error: 'Error al obtener rendimiento' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/rendimiento/evolucion
// Evolución temporal de calificaciones del alumno (por mes)
// ─────────────────────────────────────────────────────────────
router.get('/rendimiento/evolucion', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  try {
    const query = `
      SELECT 
        strftime('%Y-%m', e.fecha_calificacion) as periodo,
        AVG(e.calificacion) as promedio,
        COUNT(*) as cantidad
      FROM entregas e
      JOIN trabajos t ON t.id = e.trabajo_id
      JOIN alumnos_clases ac ON ac.codigo = (SELECT codigo FROM clases WHERE id = t.clase_id)
      WHERE e.alumno_id = $1 
        AND e.estado = 'corregido' 
        AND e.calificacion IS NOT NULL
        AND e.fecha_calificacion IS NOT NULL
      GROUP BY strftime('%Y-%m', e.fecha_calificacion)
      ORDER BY periodo ASC
    `;
    const result = await pool.query(query, [userId]);
    const evolucion = result.rows.map((r: any) => ({
      periodo: r.periodo,
      promedio: Math.round(Number(r.promedio) * 10) / 10,
      cantidad: Number(r.cantidad),
    }));
    return res.json(evolucion);
  } catch (error) {
    console.error('Error evolución:', error);
    return res.status(500).json({ error: 'Error al obtener evolución' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/rendimiento/clase/:claseId
// Rendimiento de todos los alumnos en una clase (solo profesor)
// ─────────────────────────────────────────────────────────────
router.get('/rendimiento/clase/:claseId', async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const userId = getUserId(req);
  const rol = getUserRol(req);

  if (!userId || (rol !== 'profesor' && rol !== 'admin')) {
    return res.status(403).json({ error: 'Solo los profesores pueden ver el rendimiento del curso.' });
  }

  try {
    // Info de la clase
    const claseRes = await pool.query('SELECT * FROM clases WHERE id = $1', [claseId]);
    if (claseRes.rows.length === 0) return res.status(404).json({ error: 'Clase no encontrada' });
    const clase = claseRes.rows[0];

    // Trabajos de la clase
    const trabajosRes = await pool.query('SELECT id, titulo, puntos_max FROM trabajos WHERE clase_id = $1', [claseId]);
    const trabajos = trabajosRes.rows;

    // Alumnos de la clase
    const alumnosQ = `
      SELECT DISTINCT u.id_usuario as id, u.nombre_completo, u.correo
      FROM alumnos_clases ac
      JOIN usuarios u ON u.id_usuario = ac.alumno_id
      WHERE ac.codigo = $1
      ORDER BY u.nombre_completo
    `;
    const alumnosRes = await pool.query(alumnosQ, [clase.codigo]);
    const alumnos = alumnosRes.rows;

    const alumnosRendimiento: any[] = [];

    for (const alumno of alumnos) {
      const entregasQ = `
        SELECT e.trabajo_id, e.estado, e.calificacion, e.fecha_entrega
        FROM entregas e
        JOIN trabajos t ON t.id = e.trabajo_id
        WHERE t.clase_id = $1 AND e.alumno_id = $2
      `;
      const entregasRes = await pool.query(entregasQ, [claseId, alumno.id]);
      const entregas = entregasRes.rows;

      const calificadas = entregas
        .filter((e: any) => e.estado === 'corregido' && e.calificacion !== null)
        .map((e: any) => Number(e.calificacion));

      const promedio = calificadas.length > 0
        ? Math.round((calificadas.reduce((a: number, b: number) => a + b, 0) / calificadas.length) * 10) / 10
        : null;

      const entregados = entregas.length;
      const pendientes = trabajos.length - entregados;
      const porcentaje = trabajos.length > 0 ? Math.round((entregados / trabajos.length) * 100) : 0;

      let estado_label = 'Sin datos';
      if (promedio !== null) {
        if (promedio >= 9) estado_label = 'Excelente';
        else if (promedio >= 7) estado_label = 'Muy bueno';
        else if (promedio >= 6) estado_label = 'Bueno';
        else if (promedio >= 5) estado_label = 'Regular';
        else estado_label = 'Necesita atención';
      }

      alumnosRendimiento.push({
        id: alumno.id,
        nombre: alumno.nombre_completo,
        correo: alumno.correo,
        promedio,
        entregados,
        pendientes,
        porcentaje_entregas: porcentaje,
        calificados: calificadas.length,
        estado_label,
      });
    }

    // Promedio general del curso
    const promediosValidos = alumnosRendimiento.filter(a => a.promedio !== null).map(a => a.promedio);
    const promedio_general = promediosValidos.length > 0
      ? Math.round((promediosValidos.reduce((a: number, b: number) => a + b, 0) / promediosValidos.length) * 10) / 10
      : null;

    return res.json({
      clase: { id: clase.id, nombre: clase.nombre, materia: clase.materia },
      total_trabajos: trabajos.length,
      total_alumnos: alumnos.length,
      promedio_general,
      alumnos: alumnosRendimiento,
    });
  } catch (error) {
    console.error('Error rendimiento clase:', error);
    return res.status(500).json({ error: 'Error al obtener rendimiento de la clase' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/rendimiento/alumno/:alumnoId/clase/:claseId
// Rendimiento individual de un alumno (para el profesor)
// ─────────────────────────────────────────────────────────────
router.get('/rendimiento/alumno/:alumnoId/clase/:claseId', async (req: Request, res: Response) => {
  const { alumnoId, claseId } = req.params;
  const userId = getUserId(req);
  const rol = getUserRol(req);

  if (!userId || (rol !== 'profesor' && rol !== 'admin')) {
    return res.status(403).json({ error: 'Solo los profesores pueden ver esta información.' });
  }

  try {
    const trabajosQ = `
      SELECT t.id, t.titulo, t.puntos_max, t.fecha_limite,
             e.calificacion, e.estado as estado_entrega, e.fecha_entrega, e.feedback
      FROM trabajos t
      LEFT JOIN entregas e ON e.trabajo_id = t.id AND e.alumno_id = $1
      WHERE t.clase_id = $2
      ORDER BY t.fecha_creacion ASC
    `;
    const result = await pool.query(trabajosQ, [alumnoId, claseId]);

    const alumnoQ = await pool.query('SELECT nombre_completo, correo FROM usuarios WHERE id_usuario = $1', [alumnoId]);
    const alumno = alumnoQ.rows[0] || { nombre_completo: 'Alumno', correo: '' };

    const trabajos = result.rows;
    const calificadas = trabajos
      .filter((t: any) => t.calificacion !== null)
      .map((t: any) => Number(t.calificacion));

    const promedio = calificadas.length > 0
      ? Math.round((calificadas.reduce((a: number, b: number) => a + b, 0) / calificadas.length) * 10) / 10
      : null;

    return res.json({
      alumno: { id: alumnoId, ...alumno },
      promedio,
      trabajos: trabajos.map((t: any) => ({
        id: t.id,
        titulo: t.titulo,
        puntos_max: t.puntos_max,
        fecha_limite: t.fecha_limite,
        calificacion: t.calificacion,
        estado_entrega: t.estado_entrega || 'sin_entregar',
        fecha_entrega: t.fecha_entrega,
        feedback: t.feedback,
      })),
    });
  } catch (error) {
    console.error('Error rendimiento individual:', error);
    return res.status(500).json({ error: 'Error al obtener rendimiento individual' });
  }
});

export default router;
