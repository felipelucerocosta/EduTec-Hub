/**
 * ============================================================================
 * ARCHIVO: oportunidades_controller.ts
 * PLUGIN: EduTech Oportunidades — Portal de Pasantías y Proyectos
 * ROL ARQUITECTURAL: Controlador HTTP (Capa de Presentación / API Backend)
 * ============================================================================
 * 
 * RESPONSABILIDAD:
 * Este archivo define los controladores que reciben las peticiones HTTP (Request)
 * provenientes del frontend, extraen y validan los parámetros de entrada
 * (headers, cookies de sesión, parámetros de ruta, query strings y cuerpo JSON),
 * delegan la lógica de negocio al servicio correspondiente (OportunidadesService)
 * y formatean la respuesta HTTP (Response) con los códigos de estado apropiados
 * (200 OK, 201 Created, 400 Bad Request, 403 Forbidden, 404 Not Found, 500 Error).
 * 
 * SEGURIDAD Y CONTEXTO:
 * Las solicitudes que llegan a este controlador ya han pasado por los middlewares
 * de autenticación (requireAuth) y de control de roles (requireRoles) definidos
 * en `oportunidades_routes.ts`. La información del usuario autenticado se extrae
 * de forma confiable de `req.session.usuario`.
 */

import { Request, Response } from 'express';
import { OportunidadesService } from '../services/oportunidades_service';

export const OportunidadesController = {
  /**
   * --------------------------------------------------------------------------
   * 1. GET /health — Diagnóstico del Plugin
   * --------------------------------------------------------------------------
   * Permite verificar que el plugin esté activo, respondiendo y montado
   * correctamente en Express sin requerir autenticación previa.
   * 
   * @param _req Solicitud Express (no requiere parámetros)
   * @param res  Respuesta Express en formato JSON con metadatos del plugin
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
   * --------------------------------------------------------------------------
   * 2. GET /oportunidades — Listado Filtrado de Convocatorias
   * --------------------------------------------------------------------------
   * Obtiene la nómina de oportunidades institucionales activas (pasantías,
   * proyectos, becas), aplicando opcionalmente filtros combinables recibidos
   * por query parameters en la URL.
   * 
   * Flujo de procesamiento:
   * 1. Extrae parámetros opcionales de req.query (categoria, modalidad, nivel, estado, busqueda).
   * 2. Invoca a `OportunidadesService.listarOportunidades` que actualiza vigencias y consulta la DB.
   * 3. Devuelve { success: true, data: [...] } con status 200.
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
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  },

  /**
   * --------------------------------------------------------------------------
   * 3. GET /oportunidades/:id — Detalle Individual de una Convocatoria
   * --------------------------------------------------------------------------
   * Retorna toda la información descriptiva de una convocatoria específica,
   * incluyendo requisitos, duración, horarios, vacantes y datos del responsable.
   * 
   * @param req.params.id Identificador numérico primario de la oportunidad
   */
  async obtenerDetalle(req: Request, res: Response) {
    const id = Number(req.params.id);

    try {
      const data = await OportunidadesService.obtenerOportunidad(id);
      if (!data) {
        return res.status(404).json({ success: false, error: 'Oportunidad no encontrada' });
      }
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * --------------------------------------------------------------------------
   * 4. POST /oportunidades — Publicación de Nueva Convocatoria
   * --------------------------------------------------------------------------
   * Permite a Docentes, Preceptores o Administradores publicar una nueva
   * pasantía o proyecto técnico para que los alumnos puedan postularse.
   * 
   * Validaciones de integridad:
   * - Campos esenciales obligatorios (título, institución, descripción, categoría, cierre, vacantes).
   * - Asigna automáticamente como `responsableId` al usuario logueado en la sesión.
   * - Inicializa el estado en 'abierta'.
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

    // Validación defensiva en backend de campos obligatorios
    if (!titulo || !institucion || !descripcion || !categoria || !fecha_cierre_inscripcion || !vacantes_totales) {
      return res.status(400).json({
        success: false,
        error: 'Los campos título, institución, descripción, categoría, fecha de cierre y vacantes son obligatorios.',
      });
    }

    const emailFinal = (contacto_email ? String(contacto_email).trim() : '') || usuario.correo;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(emailFinal)) {
      return res.status(400).json({
        success: false,
        error: 'El correo de contacto tiene un formato inválido. Ingrese una dirección válida personal o institucional (ej: docente@gmail.com o docente@institucion.edu.ar).',
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
        contactoEmail: emailFinal,
        estado: 'abierta',
      });

      return res.status(201).json({ success: true, message: 'Convocatoria creada exitosamente.', id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * --------------------------------------------------------------------------
   * 5. PUT /oportunidades/:id — Modificación de una Convocatoria
   * --------------------------------------------------------------------------
   * Permite actualizar la información de una convocatoria existente.
   * 
   * Regla de Autorización:
   * - Solo el creador original (`responsable_id === usuario.id`) o un Administrador
   *   tienen permiso para alterar los datos de la convocatoria.
   */
  async modificarOportunidad(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const id = Number(req.params.id);

    // Verificar existencia previa
    const op = await OportunidadesService.obtenerOportunidad(id);
    if (!op) return res.status(404).json({ error: 'Oportunidad no encontrada' });

    // Comprobación de pertenencia o facultades de superusuario
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
   * --------------------------------------------------------------------------
   * 6. POST /oportunidades/:id/postular — Postulación del Alumno
   * --------------------------------------------------------------------------
   * Permite a un estudiante formalizar su postulación a una vacante activa,
   * enviando carta de presentación, motivación y disponibilidad horaria.
   * 
   * Regla de Negocio:
   * - Solo usuarios con rol 'alumno' pueden invocar este método.
   * - Impide doble postulación mediante la restricción UNIQUE(oportunidad_id, alumno_id).
   */
  async postularse(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const oportunidadId = Number(req.params.id);
    const { presentacion, motivacion, conocimientos_previos, disponibilidad } = req.body;

    if (!usuario || usuario.rol !== 'alumno') {
      return res.status(403).json({ error: 'Solo los estudiantes pueden postularse a oportunidades formativas.' });
    }

    try {
      const resultado = await OportunidadesService.postularse({
        oportunidadId,
        alumnoId: usuario.id,
        presentacion,
        motivacion,
        conocimientosPrevios: conocimientos_previos,
        disponibilidad,
      });

      return res.status(201).json({
        success: true,
        message: '¡Te has postulado con éxito! La postulación fue registrada en la base de datos.',
        postulacionId: resultado.postulacionId,
        notificaciones: resultado.notificaciones,
      });
    } catch (error: any) {
      // El servicio lanza excepciones claras si la convocatoria ya expiró o ya se postuló
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * --------------------------------------------------------------------------
   * 7. GET /mis-postulaciones — Seguimiento Personal del Estudiante
   * --------------------------------------------------------------------------
   * Devuelve todas las postulaciones realizadas por el alumno logueado,
   * con su estado de evaluación actual y fecha de postulación.
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
   * --------------------------------------------------------------------------
   * 8. GET /oportunidades/:id/postulantes — Lista de Aspirantes
   * --------------------------------------------------------------------------
   * Permite al responsable o administrador ver todos los alumnos inscriptos
   * a una de sus convocatorias, con sus perfiles académicos y presentaciones.
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
   * --------------------------------------------------------------------------
   * 9. PUT /postulaciones/:id/estado — Resolución y Evaluación de Aspirantes
   * --------------------------------------------------------------------------
   * Permite al docente o directivo cambiar el estado de la postulación
   * (pendiente, en_evaluacion, entrevista, aceptada, rechazada, lista_espera),
   * adjuntar observaciones formativas y desencadenar el envío de correo.
   */
  async actualizarEstadoPostulacion(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const id = Number(req.params.id);
    const { estado, notas } = req.body;

    const estadosValidos = ['pendiente', 'en_evaluacion', 'entrevista', 'aceptada', 'rechazada', 'lista_espera'];
    if (!estadosValidos.includes(estado)) {
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
   * --------------------------------------------------------------------------
   * 10. DELETE /postulaciones/:id — Cancelación Voluntaria de Postulación
   * --------------------------------------------------------------------------
   * Permite a un estudiante dar de baja su postulación mientras aún se
   * encuentre pendiente de resolución.
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
   * --------------------------------------------------------------------------
   * 11. GET /metricas — Telemetría y Estadísticas del Panel Institucional
   * --------------------------------------------------------------------------
   * Calcula indicadores cuantitativos (total publicadas, vacantes cubiertas,
   * postulaciones totales, etc.) para el dashboard analítico del docente/admin.
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
