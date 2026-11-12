import { Request, Response } from 'express';
import { OportunidadesService } from '../services/oportunidades_service';

export const OportunidadesController = {
  /**
   * GET /health - Estado del plugin
   */
  async getHealth(_req: Request, res: Response) {
    return res.json({
      status: 'active',
      plugin: 'edutech-oportunidades',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * GET /oportunidades - Listado con filtros
   */
  async listarOportunidades(req: Request, res: Response) {
    try {
      const { categoria, modalidad, nivelEducativo, estado, busqueda } = req.query;
      const data = await OportunidadesService.listarOportunidades({
        categoria: categoria ? String(categoria) : undefined,
        modalidad: modalidad ? String(modalidad) : undefined,
        nivelEducativo: nivelEducativo ? String(nivelEducativo) : undefined,
        estado: estado ? String(estado) : undefined,
        busqueda: busqueda ? String(busqueda) : undefined,
      });
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error al listar oportunidades:', error);
      return res.status(500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  /**
   * GET /oportunidades/:id - Detalle
   */
  async obtenerDetalle(req: Request, res: Response) {
    const id = Number(req.params.id);
    try {
      const data = await OportunidadesService.obtenerOportunidad(id);
      if (!data) return res.status(404).json({ success: false, error: 'Oportunidad no encontrada' });
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /oportunidades - Crear (Docentes / Administradores)
   */
  async crearOportunidad(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const {
      titulo,
      institucion,
      descripcion,
      categoria,
      tipo_oportunidad,
      requisitos,
      conocimientos,
      nivel_educativo,
      vacantes_totales,
      fecha_apertura,
      fecha_cierre_inscripcion,
      fecha_inicio,
      duracion,
      modalidad,
      ubicacion,
      horarios,
      contacto_email,
    } = req.body;

    if (!titulo || !institucion || !descripcion || !categoria || !fecha_cierre_inscripcion || !vacantes_totales) {
      return res.status(400).json({
        success: false,
        error: 'Los campos título, institución, descripción, categoría, fecha de cierre y vacantes son obligatorios.',
      });
    }

    try {
      const id = await OportunidadesService.crearOportunidad({
        titulo,
        institucion,
        descripcion,
        categoria,
        tipoOportunidad: tipo_oportunidad || 'pasantia',
        requisitos,
        conocimientos,
        nivelEducativo: nivel_educativo,
        vacantesTotales: Number(vacantes_totales),
        fechaApertura: fecha_apertura,
        fechaCierreInscripcion: fecha_cierre_inscripcion,
        fechaInicio: fecha_inicio,
        duracion,
        modalidad: modalidad || 'presencial',
        ubicacion,
        horarios,
        responsableId: usuario.id,
        contactoEmail: contacto_email || usuario.correo,
        estado: 'abierta',
      });
      return res.status(201).json({ success: true, message: 'Convocatoria creada exitosamente.', id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * PUT /oportunidades/:id - Editar
   */
  async modificarOportunidad(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const id = Number(req.params.id);

    const op = await OportunidadesService.obtenerOportunidad(id);
    if (!op) return res.status(404).json({ error: 'Oportunidad no encontrada' });

    if (op.responsable_id !== usuario.id && usuario.rol !== 'admin' && !usuario.isAdmin) {
      return res.status(403).json({ error: 'No tienes autorización para editar esta convocatoria.' });
    }

    try {
      await OportunidadesService.modificarOportunidad(id, req.body);
      return res.json({ success: true, message: 'Convocatoria actualizada con éxito.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /oportunidades/:id/postular - Postulación del estudiante
   */
  async postularse(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const oportunidadId = Number(req.params.id);
    const { presentacion, motivacion, conocimientos_previos, disponibilidad } = req.body;

    if (!usuario || usuario.rol !== 'alumno') {
      return res.status(403).json({ error: 'Solo los estudiantes pueden postularse a oportunidades formativas.' });
    }

    try {
      const postulacionId = await OportunidadesService.postularse({
        oportunidadId,
        alumnoId: usuario.id,
        presentacion,
        motivacion,
        conocimientosPrevios: conocimientos_previos,
        disponibilidad,
      });
      return res.status(201).json({
        success: true,
        message: '¡Te has postulado con éxito! El responsable evaluará tu perfil.',
        postulacionId,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /mis-postulaciones - Postulaciones del alumno en sesión
   */
  async misPostulaciones(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    try {
      const data = await OportunidadesService.listarPostulacionesAlumno(usuario.id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /oportunidades/:id/postulantes - Postulantes de una oportunidad (responsable)
   */
  async verPostulantes(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const id = Number(req.params.id);

    const op = await OportunidadesService.obtenerOportunidad(id);
    if (!op) return res.status(404).json({ error: 'Oportunidad no encontrada' });

    if (op.responsable_id !== usuario.id && usuario.rol !== 'admin' && !usuario.isAdmin) {
      return res.status(403).json({ error: 'No tienes autorización para consultar estos postulantes.' });
    }

    try {
      const postulantes = await OportunidadesService.listarPostulantesOportunidad(id);
      return res.json({ success: true, data: postulantes });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * PUT /postulaciones/:id/estado - Actualizar estado (evaluar, aceptar, rechazar)
   */
  async actualizarEstadoPostulacion(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const id = Number(req.params.id);
    const { estado, notas } = req.body;

    if (!['pendiente', 'en_evaluacion', 'entrevista', 'aceptada', 'rechazada', 'lista_espera'].includes(estado)) {
      return res.status(400).json({ error: 'Estado de postulación inválido.' });
    }

    if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
      return res.status(403).json({ error: 'No autorizado para evaluar postulaciones.' });
    }

    try {
      const result = await OportunidadesService.actualizarEstadoPostulacion(id, estado, notas);
      return res.json({ success: true, message: 'Estado actualizado correctamente.', data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * DELETE /postulaciones/:id - Cancelar postulación (alumno)
   */
  async cancelarPostulacion(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const id = Number(req.params.id);

    try {
      await OportunidadesService.cancelarPostulacion(id, usuario.id);
      return res.json({ success: true, message: 'Postulación cancelada correctamente.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /metricas - Telemetría del responsable / admin
   */
  async getMetricas(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const esAdmin = usuario.rol === 'admin' || Boolean(usuario.isAdmin);

    try {
      const metricas = await OportunidadesService.obtenerMetricasResponsable(usuario.id, esAdmin);
      return res.json({ success: true, data: metricas });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};

export default OportunidadesController;

