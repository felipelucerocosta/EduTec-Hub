import { Request, Response } from 'express';
import { PreceptoriaService } from '../services/preceptoria_service';

export const PreceptoriaController = {
  /**
   * Diagnóstico del plugin
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
   * GET /clases - Lista las comisiones asignadas al preceptor en sesión, o todas si es administrador
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
   * GET /clases/:claseId/planilla - Carga la lista de alumnos y el estado de asistencia para una fecha
   */
  async getPlanillaFecha(req: Request, res: Response) {
    const claseId = Number(req.params.claseId);
    const fecha = String(req.query.fecha || new Date().toISOString().split('T')[0]);

    try {
      const data = await PreceptoriaService.obtenerPlanillaFecha(claseId, fecha);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /clases/:claseId/asistencia - Registra o modifica la asistencia (EXCLUSIVO PRECEPTOR)
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
   * GET /clases/:claseId/historial - Historial de tomas de asistencia
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
   * GET /clases/:claseId/estadisticas - Estadísticas de asistencia
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

  // ─── Controladores Administrativos (Gestión de Asignaciones) ───

  async listarPreceptores(_req: Request, res: Response) {
    try {
      const preceptores = await PreceptoriaService.listarPreceptores();
      return res.json({ success: true, data: preceptores });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

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

  async revocarAsignacion(req: Request, res: Response) {
    const { preceptorId, claseId } = req.body;
    try {
      await PreceptoriaService.revocarAsignacion(Number(preceptorId), Number(claseId));
      return res.json({ success: true, message: 'Asignación revocada exitosamente.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  // ─── Controladores Informativos para Alumnos ───

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

  // ─── Controladores del Panel de Preceptoría ───

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

  /**
   * GET /mi-asistencia-docente - Consulta personal de asistencia laboral para profesores
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
   * GET /docentes/asistencias - Lista asistencia docente para Administradores y Preceptores
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
   * POST /docentes/asistencias - Registrar o actualizar asistencia docente (Admin/Preceptor)
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
   * DELETE /docentes/asistencias/:id - Eliminar registro de asistencia docente
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

