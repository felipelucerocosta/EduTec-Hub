/**
 * ============================================================================
 * ARCHIVO: preceptoria_controller.ts
 * PLUGIN: EduTech Preceptoría — Control Exclusivo de Asistencia
 * ROL ARQUITECTURAL: Controlador HTTP (Capa de Presentación / API Backend)
 * ============================================================================
 * 
 * RESPONSABILIDAD:
 * Gestiona el ciclo de peticiones y respuestas HTTP vinculadas a la gestión
 * escolar de preceptoría:
 * 1. Toma y actualización de asistencia diaria por comisión (exclusivo preceptor).
 * 2. Consulta personalizada de presentismo y condición de regularidad del alumno.
 * 3. Tramitación, aprobación y emisión de constancias de alumno regular.
 * 4. Analíticas de rendimiento por curso para preceptoría y directivos.
 * 5. Registro y fiscalización de asistencia laboral del cuerpo docente.
 * 
 * SEGURIDAD Y CONTEXTO:
 * Las rutas han sido previamente filtradas por los middlewares de autorización
 * (`requireAuth`, `requireExclusivoPreceptor`, `requirePreceptorAsignadoAClase`
 * y `requirePreceptorOAdmin`). Los controladores garantizan respuestas siempre
 * en formato JSON bien estructurado.
 */

import { Request, Response } from 'express';
import { PreceptoriaService } from '../services/preceptoria_service';

export const PreceptoriaController = {
  /**
   * --------------------------------------------------------------------------
   * 1. GET /health — Diagnóstico del Plugin
   * --------------------------------------------------------------------------
   * Comprueba que el microservicio de preceptoría responda y esté operativo.
   */
  async getHealth(_req: Request, res: Response) {
    return res.json({
      status: 'active',
      plugin: 'edutech-preceptoria',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * --------------------------------------------------------------------------
   * 2. GET /clases — Comisiones Autorizadas para el Preceptor o Admin
   * --------------------------------------------------------------------------
   * Si el usuario es Administrador, devuelve todas las clases del colegio.
   * Si es Preceptor, devuelve estrictamente las comisiones asignadas a su cargo.
   */
  async getClasesPreceptor(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    try {
      if (usuario && (usuario.rol === 'admin' || usuario.isAdmin)) {
        const clases = await PreceptoriaService.obtenerTodasLasClases();
        return res.json({ success: true, data: clases });
      }
      const clases = await PreceptoriaService.obtenerClasesPreceptor(usuario.id);
      return res.json({ success: true, data: clases });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * --------------------------------------------------------------------------
   * 3. GET /clases/:claseId/planilla — Carga de Planilla de Toma de Asistencia
   * --------------------------------------------------------------------------
   * Obtiene la nómina de alumnos matriculados y el estado de asistencia guardado
   * para una fecha específica (por defecto, la fecha actual YYYY-MM-DD).
   * 
   * Si no se tomó asistencia aún ese día, el servicio inicializa la lista con
   * 'PRESENTE' por defecto para que el preceptor solo marque las novedades.
   */
  async getPlanillaFecha(req: Request, res: Response) {
    const claseId = Number(req.params.claseId);
    const fecha = String(req.query.fecha || '').split('T')[0] || new Date().toISOString().split('T')[0];

    try {
      const data = await PreceptoriaService.obtenerPlanillaFecha(claseId, fecha);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * --------------------------------------------------------------------------
   * 4. POST /clases/:claseId/asistencia — Guardar/Modificar Toma de Asistencia
   * --------------------------------------------------------------------------
   * ACCESO: EXCLUSIVO PRECEPTOR ASIGNADO A LA COMISIÓN.
   * Guarda de forma transaccional la planilla completa de la jornada escolar y
   * notifica a alumnos y preceptores en tiempo real por WebSockets.
   * 
   * @param req.body.fecha Fecha de la jornada escolar (YYYY-MM-DD)
   * @param req.body.observaciones Comentarios generales de la jornada
   * @param req.body.registros Array de { alumnoId, estado, observacion }
   */
  async guardarAsistencia(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const claseId = Number(req.params.claseId);
    const { fecha, observaciones, registros } = req.body;

    if (!fecha || !registros || !Array.isArray(registros)) {
      return res.status(400).json({
        success: false,
        error: 'Fecha y registros de alumnos son obligatorios para la toma de asistencia.',
      });
    }

    try {
      const result = await PreceptoriaService.guardarAsistencia(
        claseId,
        fecha,
        usuario.id,
        observaciones,
        registros
      );
      return res.json({
        success: true,
        message: result.esNueva
          ? 'Asistencia registrada correctamente.'
          : 'Asistencia actualizada correctamente.',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * --------------------------------------------------------------------------
   * 5. GET /clases/:claseId/historial — Historial de Asistencias Tomadas
   * --------------------------------------------------------------------------
   * Devuelve un desglose cronológico de todas las jornadas de asistencia
   * asentadas en una comisión (totales de presentes, ausentes, tardes, justificados).
   */
  async getHistorial(req: Request, res: Response) {
    const claseId = Number(req.params.claseId);
    try {
      const historial = await PreceptoriaService.obtenerHistorial(claseId);
      return res.json({ success: true, data: historial });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * --------------------------------------------------------------------------
   * 6. GET /clases/:claseId/estadisticas — Indicadores Cuantitativos de Presentismo
   * --------------------------------------------------------------------------
   * Calcula el porcentaje global de asistencia de la comisión y los totales acumulados.
   */
  async getEstadisticas(req: Request, res: Response) {
    const claseId = Number(req.params.claseId);
    try {
      const stats = await PreceptoriaService.obtenerEstadisticas(claseId);
      return res.json({ success: true, data: stats });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // ==========================================================================
  // GESTIÓN DE ASIGNACIONES (SUPERVISIÓN ADMINISTRATIVA)
  // ==========================================================================

  /**
   * 7. GET /preceptores — Lista todos los preceptores registrados y cuántas clases tienen
   */
  async listarPreceptores(_req: Request, res: Response) {
    try {
      const preceptores = await PreceptoriaService.listarPreceptores();
      return res.json({ success: true, data: preceptores });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * 8. POST /asignar — Asigna un preceptor a una comisión escolar
   */
  async asignarClase(req: Request, res: Response) {
    const { preceptorId, claseId } = req.body;
    if (!preceptorId || !claseId) {
      return res.status(400).json({ error: 'preceptorId y claseId son obligatorios.' });
    }

    try {
      await PreceptoriaService.asignarPreceptorClase(Number(preceptorId), Number(claseId));
      return res.json({ success: true, message: 'Preceptor asignado exitosamente a la comisión.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * 8b. POST /admin/preceptores/:id/clases-batch — Asigna múltiples comisiones a un preceptor en lote
   */
  async asignarClasesBatch(req: Request, res: Response) {
    const preceptorId = Number(req.params.id || req.body.preceptorId);
    const { clase_ids } = req.body;

    if (!preceptorId || !Array.isArray(clase_ids)) {
      return res.status(400).json({ success: false, error: 'Se requiere preceptorId y un arreglo clase_ids.' });
    }

    try {
      const result = await PreceptoriaService.asignarClasesBatch(preceptorId, clase_ids.map(Number));
      return res.json({ success: true, message: 'Asignaciones actualizadas correctamente.', data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * 9. POST /revocar — Revoca la asignación de un preceptor sobre una comisión
   */
  async revocarAsignacion(req: Request, res: Response) {
    const preceptorId = Number(req.params.preceptorId || req.body.preceptorId);
    const claseId = Number(req.params.claseId || req.body.claseId);

    if (!preceptorId || !claseId) {
      return res.status(400).json({ success: false, error: 'preceptorId y claseId son obligatorios.' });
    }

    try {
      await PreceptoriaService.revocarAsignacion(preceptorId, claseId);
      return res.json({ success: true, message: 'Asignación revocada exitosamente.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  // ==========================================================================
  // VISTA INFORMATIVA PARA ALUMNOS (CONSULTA Y CONSTANCIAS)
  // ==========================================================================

  /**
   * 10. GET /mi-asistencia — Consulta Exclusiva del Estudiante
   * 
   * Devuelve las asistencias del alumno en sesión, porcentaje global,
   * desglose de inasistencias y condición de regularidad oficial.
   * Si no tiene asistencias aún, devuelve totalSesiones: 0 y porcentaje 100%
   * de forma limpia sin generar errores 404 ni excepciones técnicas.
   */
  async getMiAsistencia(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    if (!usuario || usuario.rol !== 'alumno') {
      return res.status(403).json({ success: false, error: 'Acceso reservado a alumnos.' });
    }

    try {
      const data = await PreceptoriaService.obtenerAsistenciaAlumno(usuario.id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * 11. POST /solicitar-constancia — Solicitud de Constancia de Alumno Regular
   */
  async solicitarConstancia(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    if (!usuario || usuario.rol !== 'alumno') {
      return res.status(403).json({ success: false, error: 'Acceso reservado a alumnos.' });
    }

    const { motivo, claseId } = req.body;
    try {
      const constancia = await PreceptoriaService.solicitarConstancia(usuario.id, motivo, claseId ? Number(claseId) : undefined);
      return res.status(201).json({
        success: true,
        message: 'Solicitud de constancia de alumno regular enviada a Preceptoría.',
        data: constancia
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  // ==========================================================================
  // PANEL DE CONTROL DE PRECEPTORÍA (ALUMNOS, RENDIMIENTO Y CONSTANCIAS)
  // ==========================================================================

  /**
   * 12. GET /panel/alumnos — Nómina de Alumnos con Rendimiento
   */
  async getAlumnosRendimiento(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const esAdmin = usuario.rol === 'admin';
    const preceptorId = esAdmin ? null : usuario.id;

    const claseId = req.query.claseId ? Number(req.query.claseId) : undefined;
    const q = req.query.q ? String(req.query.q) : undefined;
    const curso = req.query.curso ? String(req.query.curso) : undefined;

    try {
      const data = await PreceptoriaService.obtenerAlumnosConRendimiento(preceptorId, claseId, q, curso);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * 13. GET /panel/rendimiento-clases — Rendimiento Promedio por Comisión
   */
  async getRendimientoClases(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const esAdmin = usuario.rol === 'admin';
    const preceptorId = esAdmin ? null : usuario.id;

    try {
      const data = await PreceptoriaService.obtenerRendimientoClases(preceptorId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * 14. GET /constancias — Listado de Solicitudes de Constancias
   */
  async listarConstancias(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const esAdmin = usuario.rol === 'admin';
    const preceptorId = esAdmin ? null : usuario.id;

    try {
      const data = await PreceptoriaService.listarConstancias(preceptorId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * 15. PUT /constancias/:id — Resolver (Aprobar/Rechazar) Constancia
   */
  async resolverConstancia(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const constanciaId = Number(req.params.id);
    const { estado, observaciones } = req.body;

    if (!estado || !['APROBADA', 'RECHAZADA'].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido. Debe ser 'APROBADA' o 'RECHAZADA'." });
    }

    try {
      const result = await PreceptoriaService.resolverConstancia(constanciaId, usuario.id, estado, observaciones);
      return res.json({
        success: true,
        message: estado === 'APROBADA' ? 'Constancia aprobada y emitida exitosamente.' : 'Constancia rechazada.',
        data: result
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * 16. POST /constancias/emitir-directa — Emisión Directa por Preceptoría
   */
  async emitirConstanciaDirecta(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const { alumnoId, motivo, observaciones } = req.body;

    if (!alumnoId) {
      return res.status(400).json({ error: 'alumnoId es obligatorio.' });
    }

    try {
      const result = await PreceptoriaService.emitirConstanciaDirecta(Number(alumnoId), usuario.id, motivo, observaciones);
      return res.status(201).json({
        success: true,
        message: 'Constancia de alumno regular emitida exitosamente.',
        data: result
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  // ==========================================================================
  // ASISTENCIA LABORAL DEL PERSONAL DOCENTE
  // ==========================================================================

  /**
   * 17. GET /mi-asistencia-docente — Consulta Personal para Profesores
   */
  async getMiAsistenciaDocente(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    if (!usuario) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    try {
      const data = await PreceptoriaService.obtenerMiAsistenciaDocente(usuario.id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * 18. GET /docentes/asistencias — Listado de Presentismo Docente (Admin/Preceptor)
   */
  async listarAsistenciasDocentes(req: Request, res: Response) {
    const fecha = req.query.fecha ? String(req.query.fecha) : undefined;
    const busqueda = req.query.busqueda ? String(req.query.busqueda) : undefined;

    try {
      const data = await PreceptoriaService.listarAsistenciasDocentes(fecha, busqueda);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * 19. POST /docentes/asistencias — Asentar Asistencia de un Profesor
   */
  async guardarAsistenciaDocente(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const { profesorId, fecha, estado, motivo, observaciones } = req.body;

    if (!profesorId || !fecha || !estado) {
      return res.status(400).json({
        success: false,
        error: 'profesorId, fecha y estado son campos obligatorios.'
      });
    }

    try {
      const result = await PreceptoriaService.guardarAsistenciaDocente(
        Number(profesorId),
        String(fecha),
        estado,
        motivo,
        observaciones,
        usuario.id
      );
      return res.json({
        success: true,
        message: 'Asistencia docente registrada correctamente.',
        data: result
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * 20. DELETE /docentes/asistencias/:id — Eliminar Registro de Asistencia Docente
   */
  async eliminarAsistenciaDocente(req: Request, res: Response) {
    const id = Number(req.params.id);
    try {
      await PreceptoriaService.eliminarAsistenciaDocente(id);
      return res.json({ success: true, message: 'Registro eliminado correctamente.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};

export default PreceptoriaController;
