import pool from '../../../../backend/conexion_pg';

export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'JUSTIFICADO';

export interface RegistroInput {
  alumnoId: number;
  estado: EstadoAsistencia;
  observacion?: string;
}

export interface SesionRow {
  id: number;
  clase_id: number;
  fecha: string;
  creado_por: number;
  observaciones: string | null;
  fecha_registro: string;
}

export interface RegistroConAlumnoRow {
  id: number | null;
  alumno_id: number;
  nombre_completo: string;
  correo: string;
  DNI: string;
  estado: EstadoAsistencia;
  observacion: string | null;
}

export const AsistenciaModel = {
  /**
   * Obtiene las clases disponibles para el docente (o todas si es administrador).
   */
  async getClasesDocente(docenteId: number, esAdminOPreceptor: boolean = false) {
    if (esAdminOPreceptor) {
      const sql = `
        SELECT c.id, c.nombre, c.materia, c.seccion, c.aula, c.codigo,
               COUNT(DISTINCT ac.alumno_id) as total_alumnos
        FROM clases c
        LEFT JOIN alumnos_clases ac ON LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))
        GROUP BY c.id
        ORDER BY c.nombre ASC
      `;
      const res = await pool.query(sql);
      return res.rows;
    } else {
      const sql = `
        SELECT c.id, c.nombre, c.materia, c.seccion, c.aula, c.codigo,
               COUNT(DISTINCT ac.alumno_id) as total_alumnos
        FROM clases c
        LEFT JOIN profesores_clases pc ON pc.clase_id = c.id
        LEFT JOIN alumnos_clases ac ON LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))
        WHERE c.titular_id = $1 OR pc.profesor_id = $1
        GROUP BY c.id
        ORDER BY c.nombre ASC
      `;
      const res = await pool.query(sql, [docenteId]);
      return res.rows;
    }
  },

  /**
   * Obtiene todos los alumnos matriculados en una clase específica.
   */
  async getAlumnosDeClase(claseId: number) {
    const claseRes = await pool.query('SELECT codigo FROM clases WHERE id = $1', [claseId]);
    if (claseRes.rows.length === 0) return [];

    const codigo = claseRes.rows[0].codigo;
    const sql = `
      SELECT u.id_usuario as alumno_id, u.nombre_completo, u.correo, u.DNI, u.curso
      FROM alumnos_clases ac
      INNER JOIN usuarios u ON u.id_usuario = ac.alumno_id
      WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM($1)) AND u.rol = 'alumno'
      ORDER BY u.nombre_completo ASC
    `;
    const res = await pool.query(sql, [codigo]);
    return res.rows;
  },

  /**
   * Obtiene las fechas de sesiones en las que ya se tomó asistencia para una clase.
   */
  async getFechasSesiones(claseId: number) {
    const sql = `
      SELECT id, fecha, observaciones, fecha_registro,
             (SELECT COUNT(*) FROM plugin_asistencias_registros WHERE sesion_id = s.id AND estado = 'PRESENTE') as presentes,
             (SELECT COUNT(*) FROM plugin_asistencias_registros WHERE sesion_id = s.id AND estado = 'AUSENTE') as ausentes,
             (SELECT COUNT(*) FROM plugin_asistencias_registros WHERE sesion_id = s.id AND estado = 'TARDE') as tardes,
             (SELECT COUNT(*) FROM plugin_asistencias_registros WHERE sesion_id = s.id AND estado = 'JUSTIFICADO') as justificados
      FROM plugin_asistencias_sesiones s
      WHERE clase_id = $1
      ORDER BY fecha DESC
    `;
    const res = await pool.query(sql, [claseId]);
    return res.rows;
  },

  /**
   * Obtiene la sesión y la lista completa de alumnos con su estado guardado para una fecha dada.
   */
  async getSesionYRegistros(claseId: number, fecha: string): Promise<{ sesion: SesionRow | null; alumnos: RegistroConAlumnoRow[] }> {
    const sesionRes = await pool.query(
      'SELECT * FROM plugin_asistencias_sesiones WHERE clase_id = $1 AND fecha = $2',
      [claseId, fecha]
    );

    const sesion: SesionRow | null = sesionRes.rows[0] || null;

    // Obtener todos los alumnos de la clase
    const alumnos = await this.getAlumnosDeClase(claseId);

    // Si hay sesión registrada, cruzamos con los registros existentes
    if (sesion) {
      const regRes = await pool.query(
        'SELECT * FROM plugin_asistencias_registros WHERE sesion_id = $1',
        [sesion.id]
      );
      const regMap = new Map<number, any>();
      regRes.rows.forEach((r: any) => regMap.set(r.alumno_id, r));

      const alumnosCombinados: RegistroConAlumnoRow[] = alumnos.map((alu: any) => {
        const reg = regMap.get(alu.alumno_id);
        return {
          id: reg ? reg.id : null,
          alumno_id: alu.alumno_id,
          nombre_completo: alu.nombre_completo,
          correo: alu.correo,
          DNI: alu.DNI,
          estado: reg ? reg.estado : 'PRESENTE',
          observacion: reg ? reg.observacion : null,
        };
      });

      return { sesion, alumnos: alumnosCombinados };
    } else {
      // Si aún no se tomó asistencia en esa fecha, retornamos lista con estado por defecto PRESENTE
      const alumnosDefault: RegistroConAlumnoRow[] = alumnos.map((alu: any) => ({
        id: null,
        alumno_id: alu.alumno_id,
        nombre_completo: alu.nombre_completo,
        correo: alu.correo,
        DNI: alu.DNI,
        estado: 'PRESENTE',
        observacion: null,
      }));

      return { sesion: null, alumnos: alumnosDefault };
    }
  },

  /**
   * Guarda o actualiza una planilla completa de asistencia en una transacción atómica idempotente.
   */
  async guardarPlanilla(
    claseId: number,
    docenteId: number,
    fecha: string,
    observaciones: string | null,
    registros: RegistroInput[]
  ) {
    // 1. Iniciar o actualizar la sesión
    const existSesion = await pool.query(
      'SELECT id FROM plugin_asistencias_sesiones WHERE clase_id = $1 AND fecha = $2',
      [claseId, fecha]
    );

    let sesionId: number;

    if (existSesion.rows.length === 0) {
      const insertSesion = await pool.query(
        `INSERT INTO plugin_asistencias_sesiones (clase_id, fecha, creado_por, observaciones)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [claseId, fecha, docenteId, observaciones || null]
      );
      sesionId = insertSesion.rows[0]?.id || insertSesion.insertId;
    } else {
      sesionId = existSesion.rows[0].id;
      await pool.query(
        `UPDATE plugin_asistencias_sesiones 
         SET observaciones = $1, creado_por = $2
         WHERE id = $3`,
        [observaciones || null, docenteId, sesionId]
      );
    }

    // 2. Guardar o actualizar los registros individuales
    let guardados = 0;
    for (const reg of registros) {
      const existReg = await pool.query(
        'SELECT id FROM plugin_asistencias_registros WHERE sesion_id = $1 AND alumno_id = $2',
        [sesionId, reg.alumnoId]
      );

      if (existReg.rows.length === 0) {
        await pool.query(
          `INSERT INTO plugin_asistencias_registros (sesion_id, alumno_id, estado, observacion)
           VALUES ($1, $2, $3, $4)`,
          [sesionId, reg.alumnoId, reg.estado, reg.observacion || null]
        );
      } else {
        await pool.query(
          `UPDATE plugin_asistencias_registros 
           SET estado = $1, observacion = $2
           WHERE id = $3`,
          [reg.estado, reg.observacion || null, existReg.rows[0].id]
        );
      }
      guardados++;
    }

    return { sesionId, fecha, totalRegistros: guardados };
  },

  /**
   * Obtiene el resumen de regularidad y presentismo del estudiante en cada una de sus materias.
   */
  async getResumenAlumno(alumnoId: number) {
    // Obtener las clases en las que está inscripto el alumno
    const sqlClases = `
      SELECT c.id, c.nombre, c.materia, c.seccion, c.aula, c.creador
      FROM alumnos_clases ac
      INNER JOIN clases c ON LOWER(TRIM(c.codigo)) = LOWER(TRIM(ac.codigo))
      WHERE ac.alumno_id = $1
      ORDER BY c.nombre ASC
    `;
    const clasesRes = await pool.query(sqlClases, [alumnoId]);

    const resumenMaterias = [];

    for (const c of clasesRes.rows) {
      const statsSql = `
        SELECT 
          COUNT(s.id) as total_clases,
          SUM(CASE WHEN r.estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
          SUM(CASE WHEN r.estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes,
          SUM(CASE WHEN r.estado = 'TARDE' THEN 1 ELSE 0 END) as tardes,
          SUM(CASE WHEN r.estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados
        FROM plugin_asistencias_sesiones s
        LEFT JOIN plugin_asistencias_registros r ON r.sesion_id = s.id AND r.alumno_id = $1
        WHERE s.clase_id = $2
      `;
      const statsRes = await pool.query(statsSql, [alumnoId, c.id]);
      const s = statsRes.rows[0] || {};

      const totalClases = Number(s.total_clases) || 0;
      const presentes = Number(s.presentes) || 0;
      const ausentes = Number(s.ausentes) || 0;
      const tardes = Number(s.tardes) || 0;
      const justificados = Number(s.justificados) || 0;

      // Cómputo de presentismo técnico: (presentes + (tardes * 0.5) + (justificados * 1.0)) / totalClases
      // Si totalClases == 0 -> 100%
      let porcentaje = 100;
      if (totalClases > 0) {
        const valorEfectivo = presentes + (tardes * 0.5) + justificados;
        porcentaje = Math.round((valorEfectivo / totalClases) * 100);
      }

      let estadoRegularidad: 'REGULAR' | 'EN_RIESGO' | 'CRITICO' = 'REGULAR';
      if (totalClases >= 3) {
        if (porcentaje < 65) estadoRegularidad = 'CRITICO';
        else if (porcentaje < 75) estadoRegularidad = 'EN_RIESGO';
      }

      resumenMaterias.push({
        claseId: c.id,
        nombre: c.nombre,
        materia: c.materia,
        seccion: c.seccion,
        aula: c.aula,
        totalClases,
        presentes,
        ausentes,
        tardes,
        justificados,
        porcentaje,
        estadoRegularidad,
      });
    }

    return resumenMaterias;
  },

  /**
   * Obtiene el desglose fecha a fecha de inasistencias y tardanzas de un alumno en una clase.
   */
  async getDetalleAlumnoEnClase(alumnoId: number, claseId: number) {
    const sql = `
      SELECT s.fecha, s.observaciones as obs_clase, r.estado, r.observacion
      FROM plugin_asistencias_sesiones s
      LEFT JOIN plugin_asistencias_registros r ON r.sesion_id = s.id AND r.alumno_id = $1
      WHERE s.clase_id = $2
      ORDER BY s.fecha DESC
    `;
    const res = await pool.query(sql, [alumnoId, claseId]);
    return res.rows;
  },

  /**
   * Reporte institucional para administradores: métricas globales y por división.
   */
  async getEstadisticasAdmin() {
    const totalSesiones = (await pool.query('SELECT COUNT(*) as c FROM plugin_asistencias_sesiones')).rows[0]?.c || 0;
    const totalRegistros = (await pool.query('SELECT COUNT(*) as c FROM plugin_asistencias_registros')).rows[0]?.c || 0;

    const divisionesSql = `
      SELECT c.seccion, COUNT(DISTINCT s.id) as total_sesiones,
             SUM(CASE WHEN r.estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
             SUM(CASE WHEN r.estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes,
             SUM(CASE WHEN r.estado = 'TARDE' THEN 1 ELSE 0 END) as tardes,
             SUM(CASE WHEN r.estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados
      FROM clases c
      LEFT JOIN plugin_asistencias_sesiones s ON s.clase_id = c.id
      LEFT JOIN plugin_asistencias_registros r ON r.sesion_id = s.id
      WHERE c.seccion IS NOT NULL
      GROUP BY c.seccion
      ORDER BY c.seccion ASC
    `;
    const divisionesRes = await pool.query(divisionesSql);

    const divisiones = divisionesRes.rows.map((d: any) => {
      const presentes = Number(d.presentes) || 0;
      const ausentes = Number(d.ausentes) || 0;
      const tardes = Number(d.tardes) || 0;
      const justificados = Number(d.justificados) || 0;
      const total = presentes + ausentes + tardes + justificados;

      const porcentaje = total > 0
        ? Math.round(((presentes + (tardes * 0.5) + justificados) / total) * 100)
        : 100;

      return {
        seccion: d.seccion,
        sesiones: Number(d.total_sesiones) || 0,
        presentes,
        ausentes,
        tardes,
        justificados,
        porcentaje,
      };
    });

    return {
      totalSesiones: Number(totalSesiones),
      totalRegistros: Number(totalRegistros),
      divisiones,
    };
  },

  /**
   * Obtiene actas e incidencias de una clase
   */
  async getActasClase(claseId: number) {
    const sql = `
      SELECT a.*,
             u.nombre_completo as alumno_nombre,
             c.nombre_completo as creador_nombre
      FROM plugin_preceptoria_actas a
      LEFT JOIN usuarios u ON a.alumno_id = u.id_usuario
      LEFT JOIN usuarios c ON a.creado_por = c.id_usuario
      WHERE a.clase_id = $1
      ORDER BY a.fecha DESC, a.id DESC
    `;
    const res = await pool.query(sql, [claseId]);
    return res.rows;
  },

  /**
   * Crea una nueva acta
   */
  async crearActa(data: { claseId: number; alumnoId?: number | null; tipo: string; descripcion: string; fecha: string; creadoPor: number }) {
    const sql = `
      INSERT INTO plugin_preceptoria_actas (clase_id, alumno_id, tipo, descripcion, fecha, creado_por, estado)
      VALUES ($1, $2, $3, $4, $5, $6, 'Abierta')
      RETURNING id
    `;
    const res = await pool.query(sql, [
      data.claseId,
      data.alumnoId || null,
      data.tipo,
      data.descripcion,
      data.fecha,
      data.creadoPor
    ]);
    return res.rows?.[0]?.id || res.insertId;
  },

  /**
   * Actualiza el estado de un acta (Abierta / Resuelta)
   */
  async actualizarEstadoActa(actaId: number, estado: 'Abierta' | 'Resuelta') {
    const sql = `UPDATE plugin_preceptoria_actas SET estado = $1 WHERE id = $2`;
    await pool.query(sql, [estado, actaId]);
  },

  /**
   * Elimina un acta
   */
  async eliminarActa(actaId: number) {
    const sql = `DELETE FROM plugin_preceptoria_actas WHERE id = $1`;
    await pool.query(sql, [actaId]);
  },
};

export default AsistenciaModel;

