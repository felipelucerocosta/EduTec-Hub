import { Request, Response } from 'express';
import { AulaActivaService } from '../services/aula_activa_service';
import { verificarAccesoClase } from '../../../../backend/permisos';

export const AulaActivaController = {
  /**
   * GET /health - Estado del plugin
   */
  async getHealth(_req: Request, res: Response) {
    return res.json({
      status: 'active',
      plugin: 'aula-activa',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * GET /clases/:claseId/trabajos - Lista de trabajos
   */
  async getTrabajos(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const claseId = Number(req.params.claseId);

    const { permitido, motivo } = await verificarAccesoClase(usuario, claseId);
    if (!permitido) return res.status(403).json({ error: motivo || 'Acceso denegado a esta clase.' });

    try {
      const trabajos = await AulaActivaService.listarTrabajos(claseId, usuario.id, usuario.rol);
      return res.json({ success: true, data: trabajos });
    } catch (error: any) {
      console.error('Error al listar trabajos en Aula Activa:', error);
      return res.status(500).json({ success: false, error: error.message || 'Error interno' });
    }
  },

  /**
   * POST /clases/:claseId/trabajos - Publicar nuevo trabajo
   */
  async crearTrabajo(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const claseId = Number(req.params.claseId);

    if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
      return res.status(403).json({ error: 'Solo profesores o administradores pueden publicar consignas.' });
    }

    const { permitido, motivo } = await verificarAccesoClase(usuario, claseId);
    if (!permitido) return res.status(403).json({ error: motivo || 'No tienes permisos sobre esta clase.' });

    const { titulo, descripcion, instrucciones, fecha_limite, puntos_max, tipo_entrega } = req.body;
    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'El título del trabajo es obligatorio.' });
    }

    try {
      const id = await AulaActivaService.crearTrabajo({
        claseId,
        titulo,
        descripcion,
        instrucciones,
        fechaLimite: fecha_limite,
        puntosMax: puntos_max,
        tipoEntrega: tipo_entrega,
        creadoPor: usuario.id,
      });
      return res.status(201).json({ success: true, message: 'Trabajo publicado exitosamente en Aula Activa.', id });
    } catch (error: any) {
      console.error('Error al crear trabajo en Aula Activa:', error);
      return res.status(500).json({ success: false, error: error.message || 'Error al publicar trabajo' });
    }
  },

  /**
   * POST /trabajos/:trabajoId/entregar - Entregar tarea (alumno)
   */
  async entregarTrabajo(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const trabajoId = Number(req.params.trabajoId);
    const { comentario } = req.body;

    if (!usuario || usuario.rol !== 'alumno') {
      return res.status(403).json({ error: 'Solo los alumnos pueden enviar entregas.' });
    }

    const archivoNombre = (req as any).file ? (req as any).file.originalname : null;
    const archivoPath = (req as any).file ? (req as any).file.filename : null;

    try {
      const result = await AulaActivaService.registrarEntrega({
        trabajoId,
        alumnoId: usuario.id,
        comentario,
        archivoNombre,
        archivoPath,
      });
      return res.status(201).json({ success: true, message: 'Tarea entregada exitosamente en Aula Activa.', data: result });
    } catch (error: any) {
      console.error('Error en entrega Aula Activa:', error);
      return res.status(500).json({ success: false, error: error.message || 'Error al registrar entrega' });
    }
  },

  /**
   * POST /entregas/:entregaId/calificar - Corregir y calificar
   */
  async calificarEntrega(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const entregaId = Number(req.params.entregaId);
    const { calificacion, feedback } = req.body;

    if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
      return res.status(403).json({ error: 'Solo los profesores pueden corregir y calificar entregas.' });
    }

    if (calificacion === undefined || calificacion === null) {
      return res.status(400).json({ error: 'La calificación numérica es obligatoria.' });
    }

    try {
      const result = await AulaActivaService.calificarEntrega({
        entregaId,
        calificacion: Number(calificacion),
        feedback,
        evaluadorId: usuario.id,
      });
      return res.json({ success: true, message: 'Corrección registrada con éxito.', data: result });
    } catch (error: any) {
      console.error('Error al calificar en Aula Activa:', error);
      return res.status(400).json({ success: false, error: error.message || 'Error al calificar entrega' });
    }
  },

  /**
   * GET /clases/:claseId/consultas - Listar mensajes de consultas pedagógicas
   */
  async getConsultas(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const claseId = Number(req.params.claseId);
    const trabajoId = req.query.trabajo_id ? Number(req.query.trabajo_id) : undefined;

    const { permitido, motivo } = await verificarAccesoClase(usuario, claseId);
    if (!permitido) return res.status(403).json({ error: motivo || 'Acceso denegado a esta clase.' });

    try {
      const consultas = await AulaActivaService.listarConsultas(claseId, trabajoId);
      return res.json({ success: true, data: consultas });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /clases/:claseId/consultas - Publicar consulta
   */
  async publicarConsulta(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const claseId = Number(req.params.claseId);
    const { mensaje, trabajo_id } = req.body;

    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ error: 'El mensaje de consulta no puede estar vacío.' });
    }

    const { permitido, motivo } = await verificarAccesoClase(usuario, claseId);
    if (!permitido) return res.status(403).json({ error: motivo || 'Acceso denegado.' });

    try {
      const newId = await AulaActivaService.publicarConsulta({
        claseId,
        trabajoId: trabajo_id ? Number(trabajo_id) : null,
        usuarioId: usuario.id,
        mensaje,
      });
      return res.status(201).json({ success: true, message: 'Consulta enviada correctamente.', id: newId });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * PUT /trabajos/:trabajoId - Modificar trabajo
   */
  async modificarTrabajo(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const trabajoId = Number(req.params.trabajoId);

    const t = await AulaActivaService.obtenerTrabajo(trabajoId);
    if (!t) return res.status(404).json({ error: 'Trabajo no encontrado.' });

    const { permitido } = await verificarAccesoClase(usuario, t.clase_id);
    if (!permitido || (usuario.rol !== 'profesor' && usuario.rol !== 'admin')) {
      return res.status(403).json({ error: 'No tienes permisos para modificar este trabajo.' });
    }

    try {
      await AulaActivaService.modificarTrabajo(trabajoId, req.body);
      return res.json({ success: true, message: 'Trabajo actualizado correctamente.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * DELETE /trabajos/:trabajoId - Eliminar trabajo
   */
  async eliminarTrabajo(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const trabajoId = Number(req.params.trabajoId);

    const t = await AulaActivaService.obtenerTrabajo(trabajoId);
    if (!t) return res.status(404).json({ error: 'Trabajo no encontrado.' });

    const { permitido } = await verificarAccesoClase(usuario, t.clase_id);
    if (!permitido || (usuario.rol !== 'profesor' && usuario.rol !== 'admin')) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este trabajo.' });
    }

    try {
      await AulaActivaService.eliminarTrabajo(trabajoId);
      return res.json({ success: true, message: 'Trabajo eliminado exitosamente.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /trabajos/:trabajoId/entregas - Listar entregas de un trabajo (profesor)
   */
  async getEntregasTrabajo(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const trabajoId = Number(req.params.trabajoId);

    const t = await AulaActivaService.obtenerTrabajo(trabajoId);
    if (!t) return res.status(404).json({ error: 'Trabajo no encontrado.' });

    const { permitido } = await verificarAccesoClase(usuario, t.clase_id);
    if (!permitido) return res.status(403).json({ error: 'Acceso denegado.' });

    try {
      const entregas = await AulaActivaService.listarEntregasTrabajo(trabajoId);
      return res.json({ success: true, data: entregas });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /clases/:claseId/metricas - Métricas pedagógicas de la clase
   */
  async getMetricasClase(req: Request, res: Response) {
    const usuario = (req.session as any)?.usuario;
    const claseId = Number(req.params.claseId);

    const { permitido } = await verificarAccesoClase(usuario, claseId);
    if (!permitido) return res.status(403).json({ error: 'Acceso denegado.' });

    try {
      const metricas = await AulaActivaService.obtenerMetricasClase(claseId);
      return res.json({ success: true, data: metricas });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};

export default AulaActivaController;

