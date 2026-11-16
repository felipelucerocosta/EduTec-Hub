import pool from '../../../../backend/conexion_pg';
import { emitToClass, emitToUser, emitToAdmin } from '../../../../backend/socket_bus';
import { syncUserClassRooms } from '../../../../backend/realtime_rooms';

export interface RegistroAsistenciaPayload {
  alumnoId: number;
  estado: 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'JUSTIFICADO';
  observacion?: string;
}

export const PreceptoriaService = {
  /**
   * Obtiene todas las comisiones registradas en el establecimiento (para administradores institucionales)
   */
  async obtenerTodasLasClases() {
    const sql = `
      SELECT c.id, c.nombre, c.materia, c.seccion, c.aula, c.codigo,
             COUNT(ac.alumno_id) as total_alumnos
      FROM clases c
      LEFT JOIN alumnos_clases ac ON LOWER(TRIM(c.codigo)) = LOWER(TRIM(ac.codigo))
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `;
    const res = await pool.query(sql);
    return res.rows || [];
  },

  /**
   * Obtiene las clases que el preceptor tiene asignadas oficialmente
   */
  async obtenerClasesPreceptor(preceptorId: number) {
    const sql = `
      SELECT c.id, c.nombre, c.materia, c.seccion, c.aula, c.codigo,
             COUNT(ac.alumno_id) as total_alumnos
      FROM preceptores_clases pc
      JOIN clases c ON pc.clase_id = c.id
      LEFT JOIN alumnos_clases ac ON LOWER(TRIM(c.codigo)) = LOWER(TRIM(ac.codigo))
      WHERE pc.preceptor_id = $1
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `;
    const res = await pool.query(sql, [preceptorId]);
    return res.rows || [];
  },

  /**
   * Lista los alumnos matriculados en una clase
   */
  async obtenerAlumnosClase(claseId: number) {
    const sql = `
      SELECT u.id_usuario as alumno_id, u.nombre_completo, u.correo, u.DNI, u.curso
      FROM alumnos_clases ac
      JOIN clases c ON LOWER(TRIM(c.codigo)) = LOWER(TRIM(ac.codigo))
      JOIN usuarios u ON ac.alumno_id = u.id_usuario
      WHERE c.id = $1
      ORDER BY u.nombre_completo ASC
    `;
    const res = await pool.query(sql, [claseId]);
    return res.rows || [];
  },

  /**
   * Carga la planilla de asistencia para una comisión y fecha específica
   */
  async obtenerPlanillaFecha(claseId: number, fecha: string) {
    const sesionQ = await pool.query(
      `SELECT s.*, u.nombre_completo as preceptor_nombre
       FROM plugin_preceptoria_sesiones s
       JOIN usuarios u ON s.preceptor_id = u.id_usuario
       WHERE s.clase_id = $1 AND s.fecha = $2`,
      [claseId, fecha]
    );

    const sesion = sesionQ.rows?.[0] || null;

    // Obtener todos los alumnos matriculados en la comisión
    const alumnos = await this.obtenerAlumnosClase(claseId);

    if (!sesion) {
      return {
        sesion: null,
        alumnos: alumnos.map((a: any) => ({
          alumno_id: a.alumno_id,
          nombre_completo: a.nombre_completo,
          correo: a.correo,
          DNI: a.DNI,
          estado: 'PRESENTE', // Valor predeterminado para agilizar la carga
          observacion: '',
          existe_registro: false,
        })),
      };
    }

    // Si ya existe sesión, cruzamos con los registros persistidos
    const regQ = await pool.query(
      `SELECT r.* FROM plugin_preceptoria_registros r WHERE r.sesion_id = $1`,
      [sesion.id]
    );
    const regMap = new Map(regQ.rows.map((r: any) => [r.alumno_id, r]));

    return {
      sesion,
      alumnos: alumnos.map((a: any) => {
        const reg = regMap.get(a.alumno_id);
        return {
          alumno_id: a.alumno_id,
          nombre_completo: a.nombre_completo,
          correo: a.correo,
          DNI: a.DNI,
          estado: reg ? reg.estado : 'PRESENTE',
          observacion: reg ? reg.observacion : '',
          existe_registro: Boolean(reg),
        };
      }),
    };
  },

  /**
   * Guarda o actualiza la asistencia de una comisión por el preceptor asignado
   */
  async guardarAsistencia(
    claseId: number,
    fecha: string,
    preceptorId: number,
    observaciones: string | undefined,
    registros: RegistroAsistenciaPayload[]
  ) {
    // 1. Validar pertenencia de alumnos a la clase
    const alumnosValidos = await this.obtenerAlumnosClase(claseId);
    const idSet = new Set(alumnosValidos.map((a: any) => a.alumno_id));

    for (const r of registros) {
      if (!idSet.has(r.alumnoId)) {
        throw new Error(`El alumno con ID ${r.alumnoId} no pertenece a esta comisión.`);
      }
      if (!['PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO'].includes(r.estado)) {
        throw new Error(`Estado de asistencia inválido: ${r.estado}`);
      }
    }

    // 2. Verificar o crear la sesión de asistencia
    const sesionQ = await pool.query(
      `SELECT id FROM plugin_preceptoria_sesiones WHERE clase_id = $1 AND fecha = $2`,
      [claseId, fecha]
    );

    let sesionId: number;
    let esNueva = false;

    if (sesionQ.rows.length > 0) {
      sesionId = sesionQ.rows[0].id;
      await pool.query(
        `UPDATE plugin_preceptoria_sesiones 
         SET observaciones = $1, ultima_modificacion = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [observaciones || null, sesionId]
      );
    } else {
      esNueva = true;
      const insertSesion = await pool.query(
        `INSERT INTO plugin_preceptoria_sesiones (clase_id, fecha, preceptor_id, observaciones)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [claseId, fecha, preceptorId, observaciones || null]
      );
      sesionId = insertSesion.rows?.[0]?.id || insertSesion.insertId;
    }

    // 3. Persistir cada registro individual
    for (const r of registros) {
      const regExist = await pool.query(
        `SELECT id FROM plugin_preceptoria_registros WHERE sesion_id = $1 AND alumno_id = $2`,
        [sesionId, r.alumnoId]
      );

      if (regExist.rows.length > 0) {
        await pool.query(
          `UPDATE plugin_preceptoria_registros 
           SET estado = $1, observacion = $2, modificado_por = $3, fecha_modificacion = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [r.estado, r.observacion?.trim() || null, preceptorId, regExist.rows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO plugin_preceptoria_registros (sesion_id, alumno_id, estado, observacion, modificado_por)
           VALUES ($1, $2, $3, $4, $5)`,
          [sesionId, r.alumnoId, r.estado, r.observacion?.trim() || null, preceptorId]
        );
      }
    }

    const eventName = esNueva ? 'attendance.created' : 'attendance.updated';
    emitToClass(claseId, eventName, {
      sesion_id: sesionId,
      clase_id: claseId,
      fecha,
      preceptor_id: preceptorId,
      total_registros: registros.length,
    });
    emitToClass(claseId, 'attendance.class_updated', { clase_id: claseId, fecha });
    for (const r of registros) {
      emitToUser(r.alumnoId, eventName, {
        clase_id: claseId,
        fecha,
        estado: r.estado,
      });
    }

    return { success: true, sesionId, esNueva };
  },

  /**
   * Obtiene el historial de asistencias tomadas por fecha
   */
  async obtenerHistorial(claseId: number) {
    const sql = `
      SELECT s.id, s.fecha, s.observaciones, s.fecha_registro, s.ultima_modificacion,
             u.nombre_completo as preceptor_nombre,
             COUNT(r.id) as total_alumnos,
             SUM(CASE WHEN r.estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
             SUM(CASE WHEN r.estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes,
             SUM(CASE WHEN r.estado = 'TARDE' THEN 1 ELSE 0 END) as tardes,
             SUM(CASE WHEN r.estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados
      FROM plugin_preceptoria_sesiones s
      JOIN usuarios u ON s.preceptor_id = u.id_usuario
      LEFT JOIN plugin_preceptoria_registros r ON s.id = r.sesion_id
      WHERE s.clase_id = $1
      GROUP BY s.id
      ORDER BY s.fecha DESC
    `;
    const res = await pool.query(sql, [claseId]);
    return res.rows || [];
  },

  /**
   * Estadísticas de presentismo para una comisión
   */
  async obtenerEstadisticas(claseId: number) {
    const sql = `
      SELECT 
        COUNT(DISTINCT s.id) as total_sesiones,
        COUNT(r.id) as total_registros,
        SUM(CASE WHEN r.estado = 'PRESENTE' THEN 1 ELSE 0 END) as total_presentes,
        SUM(CASE WHEN r.estado = 'AUSENTE' THEN 1 ELSE 0 END) as total_ausentes,
        SUM(CASE WHEN r.estado = 'TARDE' THEN 1 ELSE 0 END) as total_tardes,
        SUM(CASE WHEN r.estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as total_justificados
      FROM plugin_preceptoria_sesiones s
      LEFT JOIN plugin_preceptoria_registros r ON s.id = r.sesion_id
      WHERE s.clase_id = $1
    `;
    const res = await pool.query(sql, [claseId]);
    const row = res.rows?.[0] || {};

    const totalReg = Number(row.total_registros || 0);
    const presentes = Number(row.total_presentes || 0);
    const porcentaje = totalReg > 0 ? Number(((presentes / totalReg) * 100).toFixed(1)) : 100;

    return {
      totalSesiones: Number(row.total_sesiones || 0),
      totalRegistros: totalReg,
      presentes,
      ausentes: Number(row.total_ausentes || 0),
      tardes: Number(row.total_tardes || 0),
      justificados: Number(row.total_justificados || 0),
      porcentajeAsistencia: porcentaje,
    };
  },

  /**
   * Funcionalidades Administrativas: Asignación de Preceptores
   */
  async listarPreceptores() {
    const sql = `
      SELECT u.id_usuario, u.nombre_completo, u.correo, u.DNI,
             COUNT(pc.clase_id) as total_clases_asignadas
      FROM usuarios u
      LEFT JOIN preceptores_clases pc ON u.id_usuario = pc.preceptor_id
      WHERE u.rol = 'preceptor'
      GROUP BY u.id_usuario
      ORDER BY u.nombre_completo ASC
    `;
    const res = await pool.query(sql);
    return res.rows || [];
  },

  async asignarPreceptorClase(preceptorId: number, claseId: number) {
    const precQ = await pool.query(`SELECT rol FROM usuarios WHERE id_usuario = $1`, [preceptorId]);
    if (precQ.rows.length === 0 || precQ.rows[0].rol !== 'preceptor') {
      throw new Error('El usuario especificado no tiene rol de Preceptor.');
    }

    await pool.query(
      `INSERT OR IGNORE INTO preceptores_clases (preceptor_id, clase_id) VALUES ($1, $2)`,
      [preceptorId, claseId]
    );
    await syncUserClassRooms(preceptorId);
    emitToUser(preceptorId, 'teacher.assigned', { clase_id: claseId });
    emitToAdmin('teacher.assigned', { clase_id: claseId, preceptor_id: preceptorId });
    return { success: true };
  },

  async revocarAsignacion(preceptorId: number, claseId: number) {
    await pool.query(
      `DELETE FROM preceptores_clases WHERE preceptor_id = $1 AND clase_id = $2`,
      [preceptorId, claseId]
    );
    await syncUserClassRooms(preceptorId);
    emitToUser(preceptorId, 'teacher.removed', { clase_id: claseId });
    emitToAdmin('teacher.removed', { clase_id: claseId, preceptor_id: preceptorId });
    return { success: true };
  },

  async obtenerClasesAsignadasPreceptor(preceptorId: number) {
    const sql = `
      SELECT c.id, c.nombre, c.materia, c.seccion
      FROM preceptores_clases pc
      JOIN clases c ON pc.clase_id = c.id
      WHERE pc.preceptor_id = $1
      ORDER BY c.nombre ASC
    `;
    const res = await pool.query(sql, [preceptorId]);
    return res.rows || [];
  },

  /**
   * =========================================================================
   * FUNCIONALIDAD PARA ALUMNOS: CONSULTA EXCLUSIVA DE SUS PROPIAS ASISTENCIAS
   * =========================================================================
   */
  async obtenerAsistenciaAlumno(alumnoId: number) {
    // 1. Obtener registros individuales de asistencia
    const sqlRegistros = `
      SELECT r.id, r.estado, r.observacion, r.fecha_modificacion,
             s.fecha, s.observaciones as sesion_obs,
             c.id as clase_id, c.nombre as clase_nombre, c.materia as materia_nombre
      FROM plugin_preceptoria_registros r
      JOIN plugin_preceptoria_sesiones s ON r.sesion_id = s.id
      JOIN clases c ON s.clase_id = c.id
      WHERE r.alumno_id = $1
      ORDER BY s.fecha DESC
    `;
    const regRes = await pool.query(sqlRegistros, [alumnoId]);
    const registros = regRes.rows || [];

    // 2. Calcular métricas reales
    let presentes = 0;
    let ausentes = 0;
    let tardes = 0;
    let justificados = 0;

    for (const r of registros) {
      const est = (r.estado || '').toUpperCase();
      if (est === 'PRESENTE') presentes++;
      else if (est === 'AUSENTE') ausentes++;
      else if (est === 'TARDE') tardes++;
      else if (est === 'JUSTIFICADO') justificados++;
    }

    const totalRegistros = registros.length;
    // Cálculo pedagógico: presentes + justificados cuentan para el presentismo
    const asistenciasEfectivas = presentes + justificados;
    const porcentaje = totalRegistros > 0 ? Number(((asistenciasEfectivas / totalRegistros) * 100).toFixed(1)) : 100;
    const estadoRegularidad = totalRegistros === 0 ? 'Regular' : (porcentaje >= 75 ? 'Regular' : 'No regular');

    // 3. Obtener solicitudes de constancia de alumno regular del alumno
    const constanciasQ = await pool.query(
      `SELECT c.*, p.nombre_completo as preceptor_nombre
       FROM plugin_preceptoria_constancias c
       LEFT JOIN usuarios p ON c.preceptor_id = p.id_usuario
       WHERE c.alumno_id = $1
       ORDER BY c.fecha_solicitud DESC`,
      [alumnoId]
    );

    return {
      totalInasistencias: ausentes,
      totalAsistenciasRegistradas: presentes,
      totalTardes: tardes,
      totalJustificados: justificados,
      totalSesiones: totalRegistros,
      porcentajeAsistencia: porcentaje,
      estadoRegularidad,
      esRegular: estadoRegularidad === 'Regular',
      periodoAcademico: 'Ciclo Lectivo 2026 — Período Regular',
      registros,
      constancias: constanciasQ.rows || []
    };
  },

  /**
   * =========================================================================
   * GESTIÓN DE CONSTANCIAS DE ALUMNO REGULAR
   * =========================================================================
   */
  async solicitarConstancia(alumnoId: number, motivo: string, claseId?: number) {
    const q = await pool.query(
      `INSERT INTO plugin_preceptoria_constancias (alumno_id, motivo, clase_id, estado)
       VALUES ($1, $2, $3, 'PENDIENTE') RETURNING *`,
      [alumnoId, motivo?.trim() || 'Trámite particular', claseId || null]
    );
    const nueva = q.rows?.[0] || { id: q.insertId };
    emitToAdmin('preceptoria:nueva_solicitud_constancia', { alumnoId, constanciaId: nueva.id });
    return nueva;
  },

  async listarConstancias(preceptorId?: number | null) {
    let sql = `
      SELECT c.*,
             u.nombre_completo as alumno_nombre, u.correo as alumno_correo, u.DNI as alumno_dni, u.curso as alumno_curso,
             p.nombre_completo as preceptor_nombre,
             cl.nombre as clase_nombre
      FROM plugin_preceptoria_constancias c
      JOIN usuarios u ON c.alumno_id = u.id_usuario
      LEFT JOIN usuarios p ON c.preceptor_id = p.id_usuario
      LEFT JOIN clases cl ON c.clase_id = cl.id
    `;
    const params: any[] = [];
    if (preceptorId) {
      sql += ` WHERE (c.clase_id IS NULL OR c.clase_id IN (SELECT clase_id FROM preceptores_clases WHERE preceptor_id = $1))`;
      params.push(preceptorId);
    }
    sql += ` ORDER BY CASE WHEN c.estado = 'PENDIENTE' THEN 1 ELSE 2 END, c.fecha_solicitud DESC`;
    const res = await pool.query(sql, params);
    return res.rows || [];
  },

  async resolverConstancia(constanciaId: number, preceptorId: number, estado: 'APROBADA' | 'RECHAZADA', observaciones?: string) {
    let codigo = null;
    if (estado === 'APROBADA') {
      codigo = `CAR-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    await pool.query(
      `UPDATE plugin_preceptoria_constancias
       SET estado = $1, preceptor_id = $2, observaciones = $3, fecha_resolucion = CURRENT_TIMESTAMP, codigo_verificacion = $4
       WHERE id = $5`,
      [estado, preceptorId, observaciones?.trim() || null, codigo, constanciaId]
    );

    const check = await pool.query(`SELECT alumno_id FROM plugin_preceptoria_constancias WHERE id = $1`, [constanciaId]);
    if (check.rows.length > 0) {
      emitToUser(check.rows[0].alumno_id, 'preceptoria:constancia_resuelta', {
        constanciaId,
        estado,
        codigo_verificacion: codigo
      });
    }

    return { success: true, estado, codigo_verificacion: codigo };
  },

  async emitirConstanciaDirecta(alumnoId: number, preceptorId: number, motivo: string, observaciones?: string) {
    const codigo = `CAR-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const res = await pool.query(
      `INSERT INTO plugin_preceptoria_constancias (alumno_id, preceptor_id, motivo, estado, fecha_resolucion, observaciones, codigo_verificacion)
       VALUES ($1, $2, $3, 'APROBADA', CURRENT_TIMESTAMP, $4, $5) RETURNING *`,
      [alumnoId, preceptorId, motivo?.trim() || 'Emisión directa por Preceptoría', observaciones?.trim() || null, codigo]
    );
    const nueva = res.rows?.[0] || { id: res.insertId, codigo_verificacion: codigo };
    emitToUser(alumnoId, 'preceptoria:constancia_resuelta', {
      constanciaId: nueva.id,
      estado: 'APROBADA',
      codigo_verificacion: codigo
    });
    return nueva;
  },

  /**
   * =========================================================================
   * PANEL DE PRECEPTORÍA: LISTADO DE ALUMNOS CON ASISTENCIA Y RENDIMIENTO
   * =========================================================================
   */
  async obtenerAlumnosConRendimiento(preceptorId: number | null, claseId?: number, busqueda?: string, cursoFiltro?: string) {
    let sql = `
      SELECT DISTINCT u.id_usuario as alumno_id, u.nombre_completo, u.correo, u.DNI, u.curso,
             c.id as clase_id, c.nombre as clase_nombre, c.seccion as clase_seccion
      FROM usuarios u
      JOIN alumnos_clases ac ON u.id_usuario = ac.alumno_id
      JOIN clases c ON LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))
      WHERE LOWER(TRIM(u.rol)) = 'alumno'
    `;
    const params: any[] = [];
    let pIdx = 1;

    // Si es preceptor, restringir a sus clases asignadas
    if (preceptorId) {
      sql += ` AND c.id IN (SELECT clase_id FROM preceptores_clases WHERE preceptor_id = $${pIdx++})`;
      params.push(preceptorId);
    }

    if (claseId) {
      sql += ` AND c.id = $${pIdx++}`;
      params.push(claseId);
    }

    if (busqueda && busqueda.trim()) {
      sql += ` AND (LOWER(u.nombre_completo) LIKE $${pIdx} OR LOWER(u.correo) LIKE $${pIdx} OR u.DNI LIKE $${pIdx})`;
      params.push(`%${busqueda.trim().toLowerCase()}%`);
      pIdx++;
    }

    if (cursoFiltro && cursoFiltro.trim()) {
      sql += ` AND LOWER(u.curso) = $${pIdx++}`;
      params.push(cursoFiltro.trim().toLowerCase());
    }

    sql += ` ORDER BY u.nombre_completo ASC`;
    const res = await pool.query(sql, params);
    const alumnos = res.rows || [];

    // Para cada alumno, calcular estadísticas reales de asistencia y rendimiento académico
    const resultado = await Promise.all(
      alumnos.map(async (a: any) => {
        // Asistencias
        const asisQ = await pool.query(
          `SELECT r.estado FROM plugin_preceptoria_registros r
           JOIN plugin_preceptoria_sesiones s ON r.sesion_id = s.id
           WHERE r.alumno_id = $1 AND s.clase_id = $2`,
          [a.alumno_id, a.clase_id]
        );
        const rows = asisQ.rows || [];
        const totalSesiones = rows.length;
        const presentes = rows.filter((r: any) => r.estado === 'PRESENTE' || r.estado === 'JUSTIFICADO').length;
        const ausentes = rows.filter((r: any) => r.estado === 'AUSENTE').length;
        const porcentajeAsistencia = totalSesiones > 0 ? Number(((presentes / totalSesiones) * 100).toFixed(1)) : 100;
        const regularidad = totalSesiones === 0 ? 'Regular' : (porcentajeAsistencia >= 75 ? 'Regular' : 'No regular');

        // Rendimiento académico en entregas de la clase
        const notasQ = await pool.query(
          `SELECT e.calificacion as nota FROM entregas e
           JOIN trabajos t ON e.trabajo_id = t.id
           WHERE e.alumno_id = $1 AND t.clase_id = $2 AND e.calificacion IS NOT NULL`,
          [a.alumno_id, a.clase_id]
        );
        const notas = notasQ.rows || [];
        const totalNotas = notas.length;
        const promedio = totalNotas > 0
          ? Number((notas.reduce((acc: number, n: any) => acc + Number(n.nota), 0) / totalNotas).toFixed(2))
          : null;
        const estadoAcademico = promedio === null
          ? 'En curso'
          : (promedio >= 6 ? 'Satisfactorio' : 'Requiere seguimiento');

        return {
          alumno_id: a.alumno_id,
          nombre_completo: a.nombre_completo,
          correo: a.correo,
          DNI: a.DNI,
          curso: a.curso || 'Sin curso',
          clase_id: a.clase_id,
          clase_nombre: a.clase_nombre,
          clase_seccion: a.clase_seccion || '',
          totalSesiones,
          totalPresentes: presentes,
          totalAusentes: ausentes,
          porcentajeAsistencia,
          estadoRegularidad: regularidad,
          esRegular: regularidad === 'Regular',
          promedioNotas: promedio,
          estadoAcademico,
          requiereSeguimiento: estadoAcademico === 'Requiere seguimiento' || regularidad === 'No regular'
        };
      })
    );

    return resultado;
  },

  /**
   * =========================================================================
   * RENDIMIENTO GENERAL DE CADA CLASE PARA EL PRECEPTOR
   * =========================================================================
   */
  async obtenerRendimientoClases(preceptorId: number | null) {
    let sqlClases = `
      SELECT c.id, c.nombre, c.materia, c.seccion, c.aula
      FROM clases c
    `;
    const params: any[] = [];
    if (preceptorId) {
      sqlClases += ` JOIN preceptores_clases pc ON c.id = pc.clase_id WHERE pc.preceptor_id = $1`;
      params.push(preceptorId);
    }
    sqlClases += ` ORDER BY c.nombre ASC`;
    const res = await pool.query(sqlClases, params);
    const clases = res.rows || [];

    const statsClases = await Promise.all(
      clases.map(async (c: any) => {
        // Alumnos matriculados
        const alumQ = await pool.query(
          `SELECT ac.alumno_id FROM alumnos_clases ac
           JOIN clases c2 ON LOWER(TRIM(c2.codigo)) = LOWER(TRIM(ac.codigo))
           WHERE c2.id = $1`,
          [c.id]
        );
        const totalAlumnos = alumQ.rows.length;
        const alumnoIds = alumQ.rows.map((r: any) => r.alumno_id);

        if (totalAlumnos === 0) {
          return {
            clase_id: c.id,
            nombre: c.nombre,
            materia: c.materia,
            seccion: c.seccion,
            aula: c.aula,
            totalAlumnos: 0,
            promedioGeneral: null,
            alumnosSatisfactorios: 0,
            alumnosRequierenSeguimiento: 0,
            tasaAprobacion: 100,
            porcentajePresentismo: 100,
            totalTrabajos: 0
          };
        }

        // Notas de la clase
        const notasQ = await pool.query(
          `SELECT e.calificacion as nota, e.alumno_id FROM entregas e
           JOIN trabajos t ON e.trabajo_id = t.id
           WHERE t.clase_id = $1 AND e.calificacion IS NOT NULL`,
          [c.id]
        );
        const notas = notasQ.rows || [];
        const promedioGeneral = notas.length > 0
          ? Number((notas.reduce((acc: number, n: any) => acc + Number(n.nota), 0) / notas.length).toFixed(2))
          : null;

        // Notas por alumno para ver condición
        const notasPorAlumno = new Map<number, number[]>();
        for (const n of notas) {
          if (!notasPorAlumno.has(n.alumno_id)) notasPorAlumno.set(n.alumno_id, []);
          notasPorAlumno.get(n.alumno_id)!.push(Number(n.nota));
        }

        let satisfactorios = 0;
        let seguimiento = 0;

        for (const aId of alumnoIds) {
          const arr = notasPorAlumno.get(aId) || [];
          if (arr.length === 0) {
            // Sin notas aún
            satisfactorios++;
          } else {
            const promAlum = arr.reduce((acc, v) => acc + v, 0) / arr.length;
            if (promAlum >= 6) satisfactorios++;
            else seguimiento++;
          }
        }

        // Asistencia general de la clase
        const asisQ = await pool.query(
          `SELECT r.estado FROM plugin_preceptoria_registros r
           JOIN plugin_preceptoria_sesiones s ON r.sesion_id = s.id
           WHERE s.clase_id = $1`,
          [c.id]
        );
        const regRows = asisQ.rows || [];
        const totReg = regRows.length;
        const pres = regRows.filter((r: any) => r.estado === 'PRESENTE' || r.estado === 'JUSTIFICADO').length;
        const presentismo = totReg > 0 ? Number(((pres / totReg) * 100).toFixed(1)) : 100;

        // Total de TPs de la clase
        const tpQ = await pool.query(`SELECT COUNT(*) as total FROM trabajos WHERE clase_id = $1`, [c.id]);
        const totalTrabajos = Number(tpQ.rows?.[0]?.total || 0);

        // Aprobación
        const aprobadas = notas.filter((n: any) => Number(n.nota) >= 6).length;
        const tasaAprobacion = notas.length > 0 ? Number(((aprobadas / notas.length) * 100).toFixed(1)) : 100;

        return {
          clase_id: c.id,
          nombre: c.nombre,
          materia: c.materia,
          seccion: c.seccion,
          aula: c.aula,
          totalAlumnos,
          promedioGeneral,
          alumnosSatisfactorios: satisfactorios,
          alumnosRequierenSeguimiento: seguimiento,
          tasaAprobacion,
          porcentajePresentismo: presentismo,
          totalTrabajos
        };
      })
    );

    return statsClases;
  },

  /**
   * =========================================================================
   * GESTIÓN DE ASISTENCIAS DEL PERSONAL DOCENTE (LABORAL / INSTITUCIONAL)
   * =========================================================================
   */
  async obtenerMiAsistenciaDocente(profesorId: number) {
    const rowsQ = await pool.query(
      `SELECT ad.*, u.nombre_completo as modificado_por_nombre
       FROM plugin_asistencias_docentes ad
       LEFT JOIN usuarios u ON ad.modificado_por = u.id_usuario
       WHERE ad.profesor_id = $1
       ORDER BY ad.fecha DESC`,
      [profesorId]
    );

    const historial = rowsQ.rows || [];
    const totalRegistros = historial.length;
    const asistencias = historial.filter((r: any) => r.estado === 'PRESENTE').length;
    const tardes = historial.filter((r: any) => r.estado === 'TARDE').length;
    const inasistenciasJustificadas = historial.filter((r: any) => r.estado === 'AUSENTE_JUSTIFICADO').length;
    const inasistenciasInjustificadas = historial.filter((r: any) => r.estado === 'AUSENTE_INJUSTIFICADO').length;
    const totalInasistencias = inasistenciasJustificadas + inasistenciasInjustificadas;

    // Cálculo de porcentaje: (presentes + tardes) / totalRegistros * 100, si no hay registros = 100%
    const porcentajeAsistencia = totalRegistros > 0
      ? Number((((asistencias + tardes) / totalRegistros) * 100).toFixed(1))
      : 100;

    // Estado laboral institucional
    let estadoAsistencia = 'Asistencia normal';
    let estadoColor = 'green';
    if (inasistenciasInjustificadas > 0) {
      estadoAsistencia = 'Inasistencias pendientes de justificación';
      estadoColor = 'amber';
    } else if (inasistenciasJustificadas > 0) {
      estadoAsistencia = 'Inasistencias justificadas';
      estadoColor = 'blue';
    }

    return {
      profesorId,
      periodoAcademico: 'Ciclo Lectivo 2026',
      totalRegistros,
      asistenciasRegistradas: asistencias,
      tardesRegistradas: tardes,
      totalInasistencias,
      inasistenciasJustificadas,
      inasistenciasInjustificadas,
      porcentajeAsistencia,
      estadoAsistencia,
      estadoColor,
      historial
    };
  },

  async listarAsistenciasDocentes(fecha?: string, busqueda?: string) {
    let sqlProf = `
      SELECT u.id_usuario as id, u.nombre_completo, u.correo, u.DNI, p.materia,
             COALESCE(u.nivel_educativo, p.nivel_educativo, '') as nivel_educativo
      FROM usuarios u
      LEFT JOIN profesor p ON p.id_usuario = u.id_usuario
      WHERE LOWER(TRIM(u.rol)) = 'profesor'
    `;
    const params: any[] = [];
    if (busqueda && busqueda.trim()) {
      sqlProf += ` AND (LOWER(u.nombre_completo) LIKE $1 OR LOWER(u.correo) LIKE $1 OR u.DNI LIKE $1)`;
      params.push(`%${busqueda.trim().toLowerCase()}%`);
    }
    sqlProf += ` ORDER BY u.nombre_completo ASC`;

    const profRes = await pool.query(sqlProf, params);
    const profesores = profRes.rows || [];

    const fechaFiltro = fecha || new Date().toISOString().split('T')[0];

    // Obtener registros para la fecha
    const regRes = await pool.query(
      `SELECT ad.*, u.nombre_completo as modificado_por_nombre
       FROM plugin_asistencias_docentes ad
       LEFT JOIN usuarios u ON ad.modificado_por = u.id_usuario
       WHERE ad.fecha = $1`,
      [fechaFiltro]
    );
    const regMap = new Map(regRes.rows.map((r: any) => [r.profesor_id, r]));

    const resultado = profesores.map((p: any) => {
      const reg = regMap.get(p.id);
      return {
        profesor: p,
        registro: reg || null,
        fecha: fechaFiltro,
        estado: reg ? reg.estado : 'PRESENTE',
        motivo: reg ? reg.motivo : '',
        observaciones: reg ? reg.observaciones : '',
        modificado_por_nombre: reg ? reg.modificado_por_nombre : null,
        fecha_modificacion: reg ? reg.fecha_modificacion : null,
        existe_registro: Boolean(reg)
      };
    });

    return {
      fecha: fechaFiltro,
      totalProfesores: profesores.length,
      docentes: resultado
    };
  },

  async guardarAsistenciaDocente(
    profesorId: number,
    fecha: string,
    estado: 'PRESENTE' | 'AUSENTE_JUSTIFICADO' | 'AUSENTE_INJUSTIFICADO' | 'TARDE',
    motivo?: string,
    observaciones?: string,
    modificadoPor?: number
  ) {
    if (!['PRESENTE', 'AUSENTE_JUSTIFICADO', 'AUSENTE_INJUSTIFICADO', 'TARDE'].includes(estado)) {
      throw new Error('Estado de asistencia docente inválido.');
    }

    // Verificar si ya existe registro
    const check = await pool.query(
      `SELECT id FROM plugin_asistencias_docentes WHERE profesor_id = $1 AND fecha = $2`,
      [profesorId, fecha]
    );

    let res: any;
    if (check.rows.length > 0) {
      res = await pool.query(
        `UPDATE plugin_asistencias_docentes
         SET estado = $1, motivo = $2, observaciones = $3, modificado_por = $4, fecha_modificacion = CURRENT_TIMESTAMP
         WHERE profesor_id = $5 AND fecha = $6
         RETURNING *`,
        [estado, motivo || null, observaciones || null, modificadoPor || null, profesorId, fecha]
      );
    } else {
      res = await pool.query(
        `INSERT INTO plugin_asistencias_docentes (profesor_id, fecha, estado, motivo, observaciones, modificado_por)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [profesorId, fecha, estado, motivo || null, observaciones || null, modificadoPor || null]
      );
    }

    const saved = res.rows?.[0] || { id: res.insertId, profesor_id: profesorId, fecha, estado };
    emitToUser(profesorId, 'docente:asistencia_actualizada', { fecha, estado, motivo, observaciones });
    emitToAdmin('docente:asistencia_actualizada', { profesorId, fecha, estado });
    return saved;
  },

  async eliminarAsistenciaDocente(id: number) {
    await pool.query(`DELETE FROM plugin_asistencias_docentes WHERE id = $1`, [id]);
    return { success: true };
  }
};

export default PreceptoriaService;

