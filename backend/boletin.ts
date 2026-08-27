import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();

const getUserId = (req: Request) => req.session?.usuario?.id;

// ─────────────────────────────────────────────────────────────
// GET /api/boletin
// Boletín del alumno logueado con las clases en las que está inscripto
// ─────────────────────────────────────────────────────────────
router.get('/boletin', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  if (req.session?.usuario?.rol !== 'alumno' && req.session?.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los alumnos pueden consultar el boletín' });
  }

  try {
    // 1. Obtener períodos académicos (con fallback si la tabla está vacía)
    const periodosRes = await pool.query(
      'SELECT * FROM periodos_academicos ORDER BY anio DESC, fecha_inicio ASC'
    );
    let periodos = periodosRes.rows;

    if (!periodos || periodos.length === 0) {
      const currentYear = new Date().getFullYear();
      periodos = [{
        id: 1,
        nombre: 'Ciclo Lectivo Actual',
        tipo: 'Anual',
        anio: currentYear,
        fecha_inicio: `${currentYear}-01-01`,
        fecha_fin: `${currentYear}-12-31`
      }];
    }

    // 2. Obtener clases del alumno (usando la misma consulta que 'Mis clases')
    const clasesQ = `
      SELECT DISTINCT c.id, c.nombre, c.materia, c.codigo
      FROM clases c
      LEFT JOIN alumnos_clases ac ON c.codigo = ac.codigo
      WHERE ac.alumno_id = $1 OR c.seccion = 'Secundario'
      ORDER BY c.id DESC
    `;
    const clasesRes = await pool.query(clasesQ, [userId]);
    const clases = clasesRes.rows;

    if (clases.length === 0) {
      return res.json([]);
    }

    // 3. Para cada período, calcular promedios por clase/materia del alumno
    const boletinPorPeriodo = [];

    for (const periodo of periodos) {
      const materias = [];

      for (const clase of clases) {
        // Entregas calificadas en esa clase para este alumno
        const entregasQ = `
          SELECT e.calificacion, e.fecha_calificacion, e.fecha_entrega, t.titulo
          FROM entregas e
          JOIN trabajos t ON t.id = e.trabajo_id
          WHERE t.clase_id = $1
            AND e.alumno_id = $2
            AND e.calificacion IS NOT NULL
        `;
        const entregasRes = await pool.query(entregasQ, [clase.id, userId]);
        const entregas = entregasRes.rows;

        if (entregas.length === 0) {
          materias.push({
            clase_id: clase.id,
            materia: clase.materia || clase.nombre,
            nombre: clase.nombre,
            promedio: null,
            cantidad_calificadas: 0,
            estado: 'Sin calificaciones',
          });
          continue;
        }

        const califs = entregas.map((e: any) => Number(e.calificacion));
        const promedioRaw = califs.reduce((a: number, b: number) => a + b, 0) / califs.length;
        const promedio = Math.round(promedioRaw * 10) / 10;

        let estado = 'Regular';
        if (promedio >= 9) estado = 'Excelente';
        else if (promedio >= 8) estado = 'Muy bueno';
        else if (promedio >= 7) estado = 'Bueno';
        else if (promedio >= 6) estado = 'Aprobado';
        else if (promedio >= 5) estado = 'Regular';
        else estado = 'Bajo';

        materias.push({
          clase_id: clase.id,
          materia: clase.materia || clase.nombre,
          nombre: clase.nombre,
          promedio,
          cantidad_calificadas: entregas.length,
          estado,
        });
      }

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
          tipo: periodo.tipo || 'Anual',
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

// GET /api/boletin/periodos
router.get('/boletin/periodos', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM periodos_academicos ORDER BY anio DESC, fecha_inicio ASC');
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener períodos' });
  }
});

export default router;
