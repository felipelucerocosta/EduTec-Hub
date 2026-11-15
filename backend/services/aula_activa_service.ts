import pool from '../conexion_pg';
import { emitToClass, emitToUser } from '../socket_bus';

export interface TrabajoPayload {
  claseId: number;
  titulo: string;
  descripcion?: string;
  instrucciones?: string;
  fechaLimite?: string;
  puntosMax?: number;
  tipoEntrega?: 'individual' | 'grupal';
  creadoPor: number;
}

export interface EntregaPayload {
  trabajoId: number;
  alumnoId: number;
  comentario?: string;
  archivoNombre?: string;
  archivoPath?: string;
}

export interface CalificacionPayload {
  entregaId: number;
  calificacion: number;
  feedback?: string;
  evaluadorId: number;
}

/**
 * Servicio Nativo de Aula Activa — Núcleo de EduTech
 */
export const AulaActivaService = {
  /**
   * Inicializa la tabla de consultas de Aula Activa si no existe
   */
  async initDb(): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS aula_activa_consultas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clase_id INTEGER NOT NULL,
          trabajo_id INTEGER,
          usuario_id INTEGER NOT NULL,
          mensaje TEXT NOT NULL,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
          FOREIGN KEY(trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE,
          FOREIGN KEY(usuario_id) REFERENCES usuarios(id_usuario)
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_core_aula_activa_clase ON aula_activa_consultas(clase_id);`);
  },

  /**
   * Obtiene la lista de tareas de una clase con el estado particular para alumnos.
   */
  async listarTrabajos(claseId: number, usuarioId: number, rol: string) {
    const query = `
      SELECT t.*, u.nombre_completo as creador_nombre
      FROM trabajos t
      LEFT JOIN usuarios u ON t.creado_por = u.id_usuario
      WHERE t.clase_id = $1
      ORDER BY t.fecha_creacion DESC
    `;
    const result = await pool.query(query, [claseId]);
    const trabajos = result.rows || [];

    if (rol === 'alumno' && trabajos.length > 0) {
      const entregasQ = `
        SELECT trabajo_id, id as entrega_id, estado, calificacion, feedback, fecha_entrega
        FROM entregas
        WHERE alumno_id = $1
      `;
      const entregasRes = await pool.query(entregasQ, [usuarioId]);
      const entregasMap = new Map(entregasRes.rows.map((e: any) => [e.trabajo_id, e]));

      return trabajos.map((t: any) => {
        const entrega = entregasMap.get(t.id);
        const now = new Date();
        const esPasada = t.fecha_limite && new Date(t.fecha_limite) < now;
        return {
          ...t,
          mi_entrega: entrega || null,
          mi_estado: entrega ? entrega.estado : esPasada ? 'vencido' : 'sin_entregar',
        };
      });
    }

    return trabajos;
  },

  /**
   * Publicar nueva tarea en Aula Activa
   */
  async crearTrabajo(payload: TrabajoPayload) {
    const insertQ = `
      INSERT INTO trabajos (clase_id, titulo, descripcion, instrucciones, fecha_limite, puntos_max, tipo_entrega, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `;
    const res = await pool.query(insertQ, [
      payload.claseId,
      payload.titulo.trim(),
      payload.descripcion ? payload.descripcion.trim() : null,
      payload.instrucciones ? payload.instrucciones.trim() : null,
      payload.fechaLimite || null,
      payload.puntosMax || 10,
      payload.tipoEntrega === 'grupal' ? 'grupal' : 'individual',
      payload.creadoPor,
    ]);

    const newId = res.rows?.[0]?.id || res.insertId;

    emitToClass(payload.claseId, 'assignment.published', {
      id: newId,
      clase_id: payload.claseId,
      titulo: payload.titulo,
      fecha_limite: payload.fechaLimite,
    });

    return newId;
  },

  /**
   * Enviar entrega por parte de un estudiante
   */
  async registrarEntrega(payload: EntregaPayload) {
    const tQ = await pool.query('SELECT * FROM trabajos WHERE id = $1', [payload.trabajoId]);
    if (tQ.rows.length === 0) throw new Error('Trabajo no encontrado.');

    const trabajo = tQ.rows[0];
    const now = new Date();
    const esTardia = trabajo.fecha_limite && new Date(trabajo.fecha_limite) < now;
    const estado = esTardia ? 'entrega_tardia' : 'entregado';

    const existingQ = await pool.query(
      'SELECT id FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2',
      [payload.trabajoId, payload.alumnoId]
    );

    if (existingQ.rows.length > 0) {
      const updateQ = `
        UPDATE entregas 
        SET archivo_nombre = COALESCE($1, archivo_nombre),
            archivo_path = COALESCE($2, archivo_path),
            comentario = $3,
            estado = $4,
            fecha_entrega = CURRENT_TIMESTAMP
        WHERE trabajo_id = $5 AND alumno_id = $6
      `;
      await pool.query(updateQ, [
        payload.archivoNombre || null,
        payload.archivoPath || null,
        payload.comentario || '',
        estado,
        payload.trabajoId,
        payload.alumnoId,
      ]);
    } else {
      const insertQ = `
        INSERT INTO entregas (trabajo_id, alumno_id, archivo_nombre, archivo_path, comentario, estado)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await pool.query(insertQ, [
        payload.trabajoId,
        payload.alumnoId,
        payload.archivoNombre || null,
        payload.archivoPath || null,
        payload.comentario || '',
        estado,
      ]);
    }

    emitToClass(trabajo.clase_id, 'assignment.submitted', {
      trabajo_id: payload.trabajoId,
      alumno_id: payload.alumnoId,
      estado,
    });

    return { estado, success: true };
  },

  /**
   * Corrección y calificación de tarea con retroalimentación obligatoria si nota < 6
   */
  async calificarEntrega(payload: CalificacionPayload) {
    if (payload.calificacion < 1 || payload.calificacion > 10) {
      throw new Error('La calificación debe estar comprendida entre 1 y 10.');
    }

    // Regla pedagógica: nota < 6 exige feedback obligatorio
    if (payload.calificacion < 6 && (!payload.feedback || !payload.feedback.trim())) {
      throw new Error('La retroalimentación pedagógica es obligatoria para calificaciones inferiores a 6 puntos.');
    }

    const entregaQ = await pool.query(
      `SELECT e.alumno_id, t.clase_id, t.titulo, t.puntos_max 
       FROM entregas e 
       JOIN trabajos t ON e.trabajo_id = t.id 
       WHERE e.id = $1`,
      [payload.entregaId]
    );

    if (entregaQ.rows.length === 0) {
      throw new Error('Entrega no encontrada.');
    }

    const { alumno_id, clase_id, titulo, puntos_max } = entregaQ.rows[0];

    const estadoFinal = payload.calificacion >= 6 ? 'corregido' : 'reentrega';

    await pool.query(
      `UPDATE entregas 
       SET calificacion = $1, feedback = $2, estado = $3, fecha_calificacion = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [payload.calificacion, payload.feedback?.trim() || '', estadoFinal, payload.entregaId]
    );

    // Notificación al estudiante
    try {
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'calificacion', $2, $3, 'entrega', $4)`,
        [
          alumno_id,
          `Evaluación de: ${titulo}`,
          `Has obtenido ${payload.calificacion}/${puntos_max || 10}. Estado: ${estadoFinal}.`,
          payload.entregaId,
        ]
      );
    } catch (_e) {}

    // Emisión en tiempo real
    emitToUser(alumno_id, 'assignment.corrected', {
      entrega_id: payload.entregaId,
      calificacion: payload.calificacion,
      estado: estadoFinal,
      feedback: payload.feedback,
    });
    emitToUser(alumno_id, 'grade.updated', { alumno_id, calificacion: payload.calificacion });
    emitToUser(alumno_id, 'performance.updated', { alumno_id });
    emitToClass(clase_id, 'grade.updated', { entrega_id: payload.entregaId, calificacion: payload.calificacion });
    emitToClass(clase_id, 'performance.updated', { clase_id });

    return { success: true, estado: estadoFinal };
  },

  /**
   * Espacio interactivo de consultas pedagógicas
   */
  async listarConsultas(claseId: number, trabajoId?: number) {
    await this.initDb();
    let sql = `
      SELECT c.*, u.nombre_completo as usuario_nombre, u.rol as usuario_rol
      FROM aula_activa_consultas c
      JOIN usuarios u ON c.usuario_id = u.id_usuario
      WHERE c.clase_id = $1
    `;
    const params: any[] = [claseId];
    if (trabajoId) {
      sql += ` AND c.trabajo_id = $2`;
      params.push(trabajoId);
    }
    sql += ` ORDER BY c.fecha ASC`;

    const res = await pool.query(sql, params);
    return res.rows || [];
  },

  async publicarConsulta(data: { claseId: number; trabajoId?: number | null; usuarioId: number; mensaje: string }) {
    await this.initDb();
    const res = await pool.query(
      `INSERT INTO aula_activa_consultas (clase_id, trabajo_id, usuario_id, mensaje)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.claseId, data.trabajoId || null, data.usuarioId, data.mensaje.trim()]
    );
    const newId = res.rows?.[0]?.id || res.insertId;

    emitToClass(data.claseId, 'message.created', {
      id: newId,
      clase_id: data.claseId,
      trabajo_id: data.trabajoId,
      usuario_id: data.usuarioId,
      mensaje: data.mensaje,
    });

    return newId;
  },

  async obtenerTrabajo(trabajoId: number) {
    const res = await pool.query(`SELECT * FROM trabajos WHERE id = $1`, [trabajoId]);
    return res.rows?.[0] || null;
  },

  async modificarTrabajo(trabajoId: number, data: Partial<TrabajoPayload>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.titulo !== undefined) {
      fields.push(`titulo = $${idx++}`);
      values.push(data.titulo.trim());
    }
    if (data.descripcion !== undefined) {
      fields.push(`descripcion = $${idx++}`);
      values.push(data.descripcion?.trim() || null);
    }
    if (data.instrucciones !== undefined) {
      fields.push(`instrucciones = $${idx++}`);
      values.push(data.instrucciones?.trim() || null);
    }
    if (data.fechaLimite !== undefined) {
      fields.push(`fecha_limite = $${idx++}`);
      values.push(data.fechaLimite || null);
    }
    if (data.puntosMax !== undefined) {
      fields.push(`puntos_max = $${idx++}`);
      values.push(data.puntosMax);
    }

    if (fields.length === 0) return;

    values.push(trabajoId);
    const sql = `UPDATE trabajos SET ${fields.join(', ')} WHERE id = $${idx}`;
    await pool.query(sql, values);

    const t = await this.obtenerTrabajo(trabajoId);
    if (t) {
      emitToClass(t.clase_id, 'assignment.updated', {
        id: trabajoId,
        clase_id: t.clase_id,
        titulo: t.titulo,
        fecha_limite: t.fecha_limite,
      });
    }
  },

  async eliminarTrabajo(trabajoId: number) {
    const t = await this.obtenerTrabajo(trabajoId);
    if (!t) throw new Error('Trabajo no encontrado');

    await pool.query(`DELETE FROM trabajos WHERE id = $1`, [trabajoId]);

    emitToClass(t.clase_id, 'assignment.updated', {
      id: trabajoId,
      clase_id: t.clase_id,
      deleted: true,
    });
  },

  async listarEntregasTrabajo(trabajoId: number) {
    const sql = `
      SELECT e.*, u.nombre_completo as alumno_nombre, u.correo as alumno_correo, u.DNI as alumno_dni
      FROM entregas e
      JOIN usuarios u ON e.alumno_id = u.id_usuario
      WHERE e.trabajo_id = $1
      ORDER BY e.fecha_entrega DESC
    `;
    const res = await pool.query(sql, [trabajoId]);
    return res.rows || [];
  },

  async obtenerMetricasClase(claseId: number) {
    const totalTrabajosRes = await pool.query(
      `SELECT COUNT(*) as total FROM trabajos WHERE clase_id = $1`,
      [claseId]
    );
    const totalTrabajos = Number(totalTrabajosRes.rows?.[0]?.total || 0);

    const entregasRes = await pool.query(
      `SELECT e.estado, COUNT(*) as cantidad, AVG(e.calificacion) as promedio
       FROM entregas e
       JOIN trabajos t ON e.trabajo_id = t.id
       WHERE t.clase_id = $1
       GROUP BY e.estado`,
      [claseId]
    );

    const stats = {
      totalTrabajos,
      totalEntregas: 0,
      corregidas: 0,
      pendientes: 0,
      promedioGeneral: 0,
    };

    let sumaNotas = 0;
    let totalConNota = 0;

    for (const row of entregasRes.rows || []) {
      const cant = Number(row.cantidad);
      stats.totalEntregas += cant;
      if (row.estado === 'corregido') {
        stats.corregidas += cant;
        if (row.promedio !== null) {
          sumaNotas += Number(row.promedio) * cant;
          totalConNota += cant;
        }
      } else {
        stats.pendientes += cant;
      }
    }

    stats.promedioGeneral = totalConNota > 0 ? Number((sumaNotas / totalConNota).toFixed(2)) : 0;
    return stats;
  },
};

export default AulaActivaService;

