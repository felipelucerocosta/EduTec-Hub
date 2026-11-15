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
   * Obtiene las clases que el preceptor tiene asignadas oficialmente
   */
  async obtenerClasesPreceptor(preceptorId: number) {
    const sql = `
      SELECT c.id, c.nombre, c.materia, c.seccion, c.aula, c.codigo,
             COUNT(ac.alumno_id) as total_alumnos
      FROM preceptores_clases pc
      JOIN clases c ON pc.clase_id = c.id
      LEFT JOIN alumnos_clases ac ON c.id = ac.clase_id
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
      JOIN usuarios u ON ac.alumno_id = u.id_usuario
      WHERE ac.clase_id = $1
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
};

export default PreceptoriaService;

