import { Request, Response } from 'express';
import { AsistenciaModel } from '../models/asistencia_model';
import { AsistenciaService } from '../services/asistencia_service';

export class AsistenciaController {
  /**
   * GET /health
   */
  public static async getHealth(_req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        pluginId: 'asistencia-academica',
        nombre: 'Plugin de Asistencia Académica y Regularidad',
        version: '1.0.0',
        estado: 'ONLINE',
        uptimeSegundos: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * GET /clases - Lista de clases del docente logueado
   */
  public static async getClasesDocente(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;

    try {
      const clases = await AsistenciaModel.getClasesDocente(usuario.id, usuario.rol === 'admin');
      return res.json({ success: true, data: clases });
    } catch (error) {
      console.error('Error al obtener clases del docente:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener clases' });
    }
  }

  /**
   * GET /clases/:claseId/fechas - Historial de fechas tomadas
   */
  public static async getFechasClase(req: Request, res: Response) {
    const claseId = Number(req.params.claseId);

    try {
      const fechas = await AsistenciaModel.getFechasSesiones(claseId);
      return res.json({ success: true, data: fechas });
    } catch (error) {
      console.error('Error al obtener fechas de clase:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener fechas' });
    }
  }

  /**
   * GET /clases/:claseId - Planilla para una fecha específica
   */
  public static async getPlanillaFecha(req: Request, res: Response) {
    const claseId = Number(req.params.claseId);
    const fecha = req.query.fecha as string | undefined;

    try {
      const resultado = await AsistenciaService.obtenerPlanillaFecha(claseId, fecha);
      return res.json({ success: true, data: resultado });
    } catch (error: any) {
      console.error('Error al obtener planilla:', error);
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  }

  /**
   * POST /clases/:claseId - Guardar o actualizar planilla
   */
  public static async guardarPlanilla(req: Request, res: Response) {
    const claseId = Number(req.params.claseId);
    const usuario = (req.session as any)?.usuario;
    const { fecha, observaciones, registros } = req.body;

    try {
      const resultado = await AsistenciaService.procesarPlanilla(
        claseId,
        usuario.id,
        fecha,
        observaciones,
        registros
      );
      return res.json({
        success: true,
        message: 'Planilla de asistencia guardada correctamente.',
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al guardar planilla de asistencia:', error);
      return res.status(error.status || 500).json({ success: false, error: error.message || 'Error interno' });
    }
  }

  /**
   * GET /alumno/resumen - Resumen de regularidad del alumno logueado
   */
  public static async getResumenAlumno(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;

    try {
      const resumen = await AsistenciaModel.getResumenAlumno(usuario.id);
      return res.json({ success: true, data: resumen });
    } catch (error) {
      console.error('Error al obtener resumen de asistencia del alumno:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener resumen de asistencia' });
    }
  }

  /**
   * GET /alumno/clase/:claseId - Detalle fecha a fecha del alumno
   */
  public static async getDetalleAlumno(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const claseId = Number(req.params.claseId);

    try {
      const detalle = await AsistenciaModel.getDetalleAlumnoEnClase(usuario.id, claseId);
      return res.json({ success: true, data: detalle });
    } catch (error) {
      console.error('Error al obtener detalle de asistencia:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener detalle' });
    }
  }

  /**
   * GET /admin/estadisticas - Reporte institucional
   */
  public static async getEstadisticasAdmin(_req: Request, res: Response) {
    try {
      const stats = await AsistenciaModel.getEstadisticasAdmin();
      return res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error al obtener estadísticas de asistencia institucional:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
  }
}

export default AsistenciaController;

