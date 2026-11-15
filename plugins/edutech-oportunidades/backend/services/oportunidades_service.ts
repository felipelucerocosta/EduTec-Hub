import pool from '../../../../backend/conexion_pg';
import { emitToAuthenticated, emitToUser } from '../../../../backend/socket_bus';
import EmailOportunidadesService from './email_service';

export interface OportunidadPayload {
  titulo: string;
  institucion: string;
  descripcion: string;
  categoria: string;
  tipoOportunidad: string;
  requisitos?: string;
  conocimientos?: string;
  nivelEducativo?: string;
  vacantesTotales: number;
  fechaApertura?: string;
  fechaCierreInscripcion: string;
  fechaInicio?: string;
  duracion?: string;
  modalidad: string;
  ubicacion?: string;
  horarios?: string;
  responsableId: number;
  contactoEmail: string;
  estado?: string;
}

export interface PostulacionPayload {
  oportunidadId: number;
  alumnoId: number;
  presentacion?: string;
  motivacion?: string;
  conocimientosPrevios?: string;
  disponibilidad?: string;
}

export const OportunidadesService = {
  /**
   * Cierra automáticamente aquellas oportunidades cuya fecha de inscripción ya expiró.
   */
  async actualizarVigencias(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `UPDATE plugin_oportunidades 
       SET estado = 'cerrada' 
       WHERE estado = 'abierta' AND fecha_cierre_inscripcion < $1`,
      [today]
    );
  },

  /**
   * Listar oportunidades públicas con filtros
   */
  async listarOportunidades(filtros: {
    categoria?: string;
    modalidad?: string;
    nivelEducativo?: string;
    estado?: string;
    busqueda?: string;
  }) {
    await this.actualizarVigencias();

    let sql = `
      SELECT o.*, u.nombre_completo as responsable_nombre
      FROM plugin_oportunidades o
      JOIN usuarios u ON o.responsable_id = u.id_usuario
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filtros.estado) {
      sql += ` AND o.estado = $${idx++}`;
      params.push(filtros.estado);
    } else {
      sql += ` AND o.estado IN ('abierta', 'cerrada', 'finalizada')`;
    }

    if (filtros.categoria && filtros.categoria !== 'todas') {
      sql += ` AND o.categoria = $${idx++}`;
      params.push(filtros.categoria);
    }

    if (filtros.modalidad && filtros.modalidad !== 'todas') {
      sql += ` AND o.modalidad = $${idx++}`;
      params.push(filtros.modalidad);
    }

    if (filtros.nivelEducativo && filtros.nivelEducativo !== 'todos') {
      sql += ` AND o.nivel_educativo = $${idx++}`;
      params.push(filtros.nivelEducativo);
    }

    if (filtros.busqueda && filtros.busqueda.trim()) {
      sql += ` AND (o.titulo LIKE $${idx} OR o.descripcion LIKE $${idx} OR o.institucion LIKE $${idx})`;
      params.push(`%${filtros.busqueda.trim()}%`);
      idx++;
    }

    sql += ` ORDER BY o.fecha_publicacion DESC`;

    const res = await pool.query(sql, params);
    return res.rows || [];
  },

  /**
   * Obtener detalle de una oportunidad
   */
  async obtenerOportunidad(id: number) {
    await this.actualizarVigencias();
    const sql = `
      SELECT o.*, u.nombre_completo as responsable_nombre, u.correo as responsable_correo
      FROM plugin_oportunidades o
      JOIN usuarios u ON o.responsable_id = u.id_usuario
      WHERE o.id = $1
    `;
    const res = await pool.query(sql, [id]);
    return res.rows?.[0] || null;
  },

  /**
   * Crear nueva oportunidad institucional
   */
  async crearOportunidad(payload: OportunidadPayload) {
    if (payload.vacantesTotales <= 0) {
      throw new Error('La cantidad de vacantes totales debe ser mayor a 0.');
    }

    const sql = `
      INSERT INTO plugin_oportunidades (
        titulo, institucion, descripcion, categoria, tipo_oportunidad,
        requisitos, conocimientos, nivel_educativo, vacantes_totales, vacantes_ocupadas,
        fecha_apertura, fecha_cierre_inscripcion, fecha_inicio, duracion,
        modalidad, ubicacion, horarios, responsable_id, contacto_email, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id
    `;

    const res = await pool.query(sql, [
      payload.titulo.trim(),
      payload.institucion.trim(),
      payload.descripcion.trim(),
      payload.categoria,
      payload.tipoOportunidad || 'pasantia',
      payload.requisitos?.trim() || null,
      payload.conocimientos?.trim() || null,
      payload.nivelEducativo || 'secundario_tecnico',
      payload.vacantesTotales,
      payload.fechaApertura || null,
      payload.fechaCierreInscripcion,
      payload.fechaInicio || null,
      payload.duracion || null,
      payload.modalidad || 'presencial',
      payload.ubicacion?.trim() || null,
      payload.horarios?.trim() || null,
      payload.responsableId,
      payload.contactoEmail.trim(),
      payload.estado || 'abierta',
    ]);

    const newId = res.rows?.[0]?.id || res.insertId;

    emitToAuthenticated('opportunity.created', {
      id: newId,
      titulo: payload.titulo,
      institucion: payload.institucion,
      categoria: payload.categoria,
      vacantes: payload.vacantesTotales,
    });

    return newId;
  },

  /**
   * Modificar oportunidad existente
   */
  async modificarOportunidad(id: number, data: Partial<OportunidadPayload>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.titulo !== undefined) {
      fields.push(`titulo = $${idx++}`);
      values.push(data.titulo.trim());
    }
    if (data.descripcion !== undefined) {
      fields.push(`descripcion = $${idx++}`);
      values.push(data.descripcion.trim());
    }
    if (data.requisitos !== undefined) {
      fields.push(`requisitos = $${idx++}`);
      values.push(data.requisitos?.trim() || null);
    }
    if (data.vacantesTotales !== undefined) {
      fields.push(`vacantes_totales = $${idx++}`);
      values.push(data.vacantesTotales);
    }
    if (data.fechaCierreInscripcion !== undefined) {
      fields.push(`fecha_cierre_inscripcion = $${idx++}`);
      values.push(data.fechaCierreInscripcion);
    }
    if (data.modalidad !== undefined) {
      fields.push(`modalidad = $${idx++}`);
      values.push(data.modalidad);
    }
    if (data.estado !== undefined) {
      fields.push(`estado = $${idx++}`);
      values.push(data.estado);
    }

    if (fields.length === 0) return;

    values.push(id);
    const sql = `UPDATE plugin_oportunidades SET ${fields.join(', ')} WHERE id = $${idx}`;
    await pool.query(sql, values);

    emitToAuthenticated('opportunity.updated', { id, ...data });
  },

  /**
   * Postulación de un alumno a una oportunidad
   */
  async postularse(payload: PostulacionPayload) {
    await this.actualizarVigencias();

    // 1. Obtener oportunidad y validar vigencia
    const op = await this.obtenerOportunidad(payload.oportunidadId);
    if (!op) {
      throw new Error('La convocatoria especificada no existe.');
    }

    if (op.estado !== 'abierta') {
      throw new Error(`Las inscripciones para esta oportunidad se encuentran ${op.estado}.`);
    }

    const today = new Date().toISOString().split('T')[0];
    if (op.fecha_cierre_inscripcion < today) {
      throw new Error('La fecha límite para inscribirse en esta oportunidad ha expirado.');
    }

    if (op.vacantes_ocupadas >= op.vacantes_totales) {
      throw new Error('No hay vacantes disponibles para esta convocatoria.');
    }

    // 2. Verificar si el alumno ya se postuló
    const dupQ = await pool.query(
      `SELECT id, estado FROM plugin_oportunidades_postulaciones 
       WHERE oportunidad_id = $1 AND alumno_id = $2`,
      [payload.oportunidadId, payload.alumnoId]
    );

    if (dupQ.rows.length > 0) {
      throw new Error('Ya posees una postulación registrada para esta oportunidad.');
    }

    // 3. Obtener datos del alumno
    const alumnoQ = await pool.query(
      `SELECT id_usuario, nombre_completo, correo, DNI FROM usuarios WHERE id_usuario = $1`,
      [payload.alumnoId]
    );
    if (alumnoQ.rows.length === 0) {
      throw new Error('Usuario estudiante no encontrado.');
    }
    const alumno = alumnoQ.rows[0];

    // 4. Insertar postulación
    const insertQ = `
      INSERT INTO plugin_oportunidades_postulaciones (
        oportunidad_id, alumno_id, presentacion, motivacion, conocimientos_previos, disponibilidad, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
      RETURNING id
    `;
    const res = await pool.query(insertQ, [
      payload.oportunidadId,
      payload.alumnoId,
      payload.presentacion?.trim() || null,
      payload.motivacion?.trim() || null,
      payload.conocimientosPrevios?.trim() || null,
      payload.disponibilidad?.trim() || null,
    ]);
    const postulacionId = res.rows?.[0]?.id || res.insertId;

    // 5. Notificación interna al responsable en tabla notificaciones
    try {
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'oportunidad_postulacion', $2, $3, 'oportunidad', $4)`,
        [
          op.responsable_id,
          `Nueva postulación: ${op.titulo}`,
          `${alumno.nombre_completo} se ha postulado para ${op.titulo}.`,
          payload.oportunidadId,
        ]
      );
    } catch (_e) {}

    // 6. Enviar correo electrónico al responsable con datos del alumno
    EmailOportunidadesService.notificarNuevaPostulacion({
      destinatarioEmail: op.contacto_email,
      responsableNombre: op.responsable_nombre,
      oportunidadTitulo: op.titulo,
      institucion: op.institucion,
      alumnoNombre: alumno.nombre_completo,
      alumnoEmail: alumno.correo,
      alumnoDni: alumno.DNI,
      fechaPostulacion: new Date().toLocaleString(),
      motivacion: payload.motivacion,
    }).catch((err) => {
      console.warn('Fallo en el servicio de correo de oportunidades:', err);
    });

    // 7. Notificación en tiempo real por WebSockets
    emitToUser(op.responsable_id, 'application.created', {
      postulacion_id: postulacionId,
      oportunidad_id: payload.oportunidadId,
      alumno_nombre: alumno.nombre_completo,
      titulo: op.titulo,
    });

    emitToUser(payload.alumnoId, 'application.created', {
      postulacion_id: postulacionId,
      oportunidad_id: payload.oportunidadId,
      estado: 'pendiente',
    });

    return postulacionId;
  },

  /**
   * Listar postulaciones de un alumno
   */
  async listarPostulacionesAlumno(alumnoId: number) {
    const sql = `
      SELECT p.*, o.titulo as oportunidad_titulo, o.institucion, o.categoria, o.modalidad,
             o.estado as oportunidad_estado, o.fecha_cierre_inscripcion
      FROM plugin_oportunidades_postulaciones p
      JOIN plugin_oportunidades o ON p.oportunidad_id = o.id
      WHERE p.alumno_id = $1
      ORDER BY p.fecha_postulacion DESC
    `;
    const res = await pool.query(sql, [alumnoId]);
    return res.rows || [];
  },

  /**
   * Listar postulantes a una oportunidad (para el responsable / admin)
   */
  async listarPostulantesOportunidad(oportunidadId: number) {
    const sql = `
      SELECT p.*, u.nombre_completo as alumno_nombre, u.correo as alumno_correo, u.DNI as alumno_dni
      FROM plugin_oportunidades_postulaciones p
      JOIN usuarios u ON p.alumno_id = u.id_usuario
      WHERE p.oportunidad_id = $1
      ORDER BY p.fecha_postulacion DESC
    `;
    const res = await pool.query(sql, [oportunidadId]);
    return res.rows || [];
  },

  /**
   * Actualizar estado de una postulación (evaluación, entrevista, aceptada, rechazada)
   * Gestiona el cupo de vacantes de forma segura.
   */
  async actualizarEstadoPostulacion(postulacionId: number, nuevoEstado: string, notasResponsable?: string) {
    const pQ = await pool.query(
      `SELECT p.*, o.id as op_id, o.titulo, o.vacantes_totales, o.vacantes_ocupadas, o.responsable_id
       FROM plugin_oportunidades_postulaciones p
       JOIN plugin_oportunidades o ON p.oportunidad_id = o.id
       WHERE p.id = $1`,
      [postulacionId]
    );

    if (pQ.rows.length === 0) {
      throw new Error('Postulación no encontrada.');
    }

    const post = pQ.rows[0];
    const estadoAnterior = post.estado;

    // Si pasa a 'aceptada', verificar vacantes
    if (nuevoEstado === 'aceptada' && estadoAnterior !== 'aceptada') {
      if (post.vacantes_ocupadas >= post.vacantes_totales) {
        throw new Error('No se puede aceptar al postulante: la convocatoria ya completó todas sus vacantes.');
      }
      // Incrementar vacantes ocupadas
      await pool.query(
        `UPDATE plugin_oportunidades 
         SET vacantes_ocupadas = vacantes_ocupadas + 1
         WHERE id = $1`,
        [post.op_id]
      );
    } else if (estadoAnterior === 'aceptada' && nuevoEstado !== 'aceptada') {
      // Si se revoca la aceptación, liberar vacante
      await pool.query(
        `UPDATE plugin_oportunidades 
         SET vacantes_ocupadas = MAX(0, vacantes_ocupadas - 1)
         WHERE id = $1`,
        [post.op_id]
      );
    }

    // Actualizar estado de la postulación
    await pool.query(
      `UPDATE plugin_oportunidades_postulaciones 
       SET estado = $1, notas_responsable = COALESCE($2, notas_responsable), fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [nuevoEstado, notasResponsable || null, postulacionId]
    );

    // Notificación interna al alumno
    try {
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'oportunidad_estado', $2, $3, 'oportunidad', $4)`,
        [
          post.alumno_id,
          `Actualización en: ${post.titulo}`,
          `El estado de tu postulación ha cambiado a: ${nuevoEstado.toUpperCase()}.`,
          post.op_id,
        ]
      );
    } catch (_e) {}

    // WebSockets
    emitToUser(post.alumno_id, 'application.status_updated', {
      postulacion_id: postulacionId,
      oportunidad_id: post.op_id,
      estado: nuevoEstado,
    });

    if (nuevoEstado === 'aceptada') {
      emitToUser(post.alumno_id, 'application.accepted', { postulacion_id: postulacionId });
      emitToAuthenticated('opportunity.vacancies_updated', { oportunidad_id: post.op_id });
    } else if (nuevoEstado === 'rechazada') {
      emitToUser(post.alumno_id, 'application.rejected', { postulacion_id: postulacionId });
    }

    return { success: true, estado: nuevoEstado };
  },

  /**
   * Cancelar postulación (alumno)
   */
  async cancelarPostulacion(postulacionId: number, alumnoId: number) {
    const pQ = await pool.query(
      `SELECT * FROM plugin_oportunidades_postulaciones WHERE id = $1 AND alumno_id = $2`,
      [postulacionId, alumnoId]
    );
    if (pQ.rows.length === 0) {
      throw new Error('Postulación no encontrada.');
    }

    const post = pQ.rows[0];
    if (post.estado === 'aceptada') {
      await pool.query(
        `UPDATE plugin_oportunidades 
         SET vacantes_ocupadas = MAX(0, vacantes_ocupadas - 1)
         WHERE id = $1`,
        [post.oportunidad_id]
      );
    }

    await pool.query(
      `UPDATE plugin_oportunidades_postulaciones 
       SET estado = 'cancelada', fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [postulacionId]
    );

    return { success: true };
  },

  /**
   * Resumen y telemetría para dashboard de responsables
   */
  async obtenerMetricasResponsable(responsableId: number, esAdmin: boolean) {
    let whereClause = esAdmin ? '' : `WHERE responsable_id = ${responsableId}`;

    const opsQ = await pool.query(`SELECT COUNT(*) as total FROM plugin_oportunidades ${whereClause}`);
    const totalOportunidades = Number(opsQ.rows?.[0]?.total || 0);

    let postWhere = esAdmin
      ? ''
      : `JOIN plugin_oportunidades o ON p.oportunidad_id = o.id WHERE o.responsable_id = ${responsableId}`;

    const postQ = await pool.query(
      `SELECT p.estado, COUNT(*) as cantidad 
       FROM plugin_oportunidades_postulaciones p ${postWhere}
       GROUP BY p.estado`
    );

    const stats = {
      totalOportunidades,
      totalPostulaciones: 0,
      pendientes: 0,
      aceptadas: 0,
      rechazadas: 0,
      entrevistas: 0,
    };

    for (const r of postQ.rows || []) {
      const cant = Number(r.cantidad);
      stats.totalPostulaciones += cant;
      if (r.estado === 'pendiente') stats.pendientes += cant;
      if (r.estado === 'aceptada') stats.aceptadas += cant;
      if (r.estado === 'rechazada') stats.rechazadas += cant;
      if (r.estado === 'entrevista') stats.entrevistas += cant;
    }

    return stats;
  },
};

export default OportunidadesService;

