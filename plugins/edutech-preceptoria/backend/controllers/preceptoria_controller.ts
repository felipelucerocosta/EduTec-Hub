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
   * GET /clases - Lista las comisiones asignadas al preceptor en sesión
   */
  async getClasesPreceptor(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    try {
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
};

export default PreceptoriaController;

