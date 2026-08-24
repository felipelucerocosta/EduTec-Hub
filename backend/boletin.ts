import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();

const getUserId = (req: Request) => req.session?.usuario?.id;

// ─────────────────────────────────────────────────────────────
// GET /api/boletin
// Boletín del alumno logueado, agrupado por períodos académicos
// ─────────────────────────────────────────────────────────────
router.get('/boletin', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  if (req.session?.usuario?.rol !== 'alumno' && req.session?.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los alumnos pueden consultar el boletín' });
  }

  try {
    // 1. Obtener períodos académicos ordenados
    const periodosRes = await pool.query(
      'SELECT * FROM periodos_academicos ORDER BY anio DESC, fecha_inicio ASC'
    );
    const periodos = periodosRes.rows;

    // 2. Obtener clases del alumno
    const clasesQ = `
      SELECT c.id, c.nombre, c.materia, c.codigo
      FROM clases c
      JOIN alumnos_clases ac ON ac.codigo = c.codigo
      WHERE ac.alumno_id = $1
    `;
    const clasesRes = await pool.query(clasesQ, [userId]);
    const clases = clasesRes.rows;

    if (clases.length === 0) {
      return res.json({ periodos: [], boletin: [] });
    }

    // 3. Para cada período, calcular promedios por materia
    const boletinPorPeriodo = [];

    for (const periodo of periodos) {
      const materias = [];

      for (const clase of clases) {
        // Entregas calificadas en ese período
        const entregasQ = `
          SELECT e.calificacion, e.fecha_calificacion, t.titulo
          FROM entregas e
          JOIN trabajos t ON t.id = e.trabajo_id
          WHERE t.clase_id = $1
            AND e.alumno_id = $2
            AND e.estado = 'corregido'
            AND e.calificacion IS NOT NULL
            AND e.fecha_calificacion >= $3
            AND e.fecha_calificacion <= $4
        `;
        const entregasRes = await pool.query(entregasQ, [
          clase.id, userId, periodo.fecha_inicio, periodo.fecha_fin + ' 23:59:59'
        ]);
        const entregas = entregasRes.rows;

        if (entregas.length === 0) {
          // Incluir igual con sin calificaciones
          materias.push({
            clase_id: clase.id,
            materia: clase.materia,
            nombre: clase.nombre,
            promedio: null,
            cantidad_calificadas: 0,
            estado: 'Sin calificaciones',
          });
          continue;
        }

        const califs = entregas.map((e: any) => Number(e.calificacion));
        const promedio = Math.round((califs.reduce((a: number, b: number) => a + b, 0) / califs.length) * 10) / 10;

        let estado = 'Regular';
        if (promedio >= 9) estado = 'Excelente';
        else if (promedio >= 8) estado = 'Muy bueno';
        else if (promedio >= 7) estado = 'Bueno';
        else if (promedio >= 6) estado = 'Aprobado';
        else if (promedio >= 5) estado = 'Regular';
        else estado = 'Bajo';

        materias.push({
          clase_id: clase.id,
          materia: clase.materia,
          nombre: clase.nombre,
          promedio,
          cantidad_calificadas: entregas.length,
          estado,
        });
      }

      // Promedio general del período
      const promediosValidos = materias.filter(m => m.promedio !== null).map(m => m.promedio as number);
      const promedio_general = promediosValidos.length > 0
        ? Math.round((promediosValidos.reduce((a: number, b: number) => a + b, 0) / promediosValidos.length) * 10) / 10
        : null;

      const mejor_materia = materias.reduce((best: any, m) => {
        if (m.promedio === null) return best;
        if (!best || m.promedio > best.promedio) return m;
        return best;
      }, null);

      boletinPorPeriodo.push({
        periodo: {
          id: periodo.id,
          nombre: periodo.nombre,
          tipo: periodo.tipo,
          fecha_inicio: periodo.fecha_inicio,
          fecha_fin: periodo.fecha_fin,
          anio: periodo.anio,
        },
        materias,
        promedio_general,
        mejor_materia: mejor_materia ? { materia: mejor_materia.materia, promedio: mejor_materia.promedio } : null,
      });
    }

    return res.json(boletinPorPeriodo);
  } catch (error) {
    console.error('Error al obtener boletín:', error);
    return res.status(500).json({ error: 'Error al obtener el boletín' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/boletin/periodos
// Lista de períodos académicos disponibles
// ─────────────────────────────────────────────────────────────
router.get('/boletin/periodos', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM periodos_academicos ORDER BY anio DESC, fecha_inicio ASC');
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener períodos' });
  }
});

export default router;
