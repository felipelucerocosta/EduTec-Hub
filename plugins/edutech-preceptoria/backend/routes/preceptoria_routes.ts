import { Router } from 'express';
import { PreceptoriaController } from '../controllers/preceptoria_controller';
import {
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  requireAdmin,
  requirePreceptorOAdmin,
} from '../middleware/preceptoria_auth';

const router = Router();

// Diagnóstico
router.get('/health', PreceptoriaController.getHealth);

// ─── Rutas Informativas para Alumnos ───
router.get('/mi-asistencia', requireAuth, PreceptoriaController.getMiAsistencia);
router.post('/solicitar-constancia', requireAuth, PreceptoriaController.solicitarConstancia);

// ─── Rutas de Asistencia Laboral Docente ───
router.get('/mi-asistencia-docente', requireAuth, PreceptoriaController.getMiAsistenciaDocente);
router.get('/docentes/asistencias', requireAuth, requirePreceptorOAdmin, PreceptoriaController.listarAsistenciasDocentes);
router.post('/docentes/asistencias', requireAuth, requirePreceptorOAdmin, PreceptoriaController.guardarAsistenciaDocente);
router.delete('/docentes/asistencias/:id', requireAuth, requireAdmin, PreceptoriaController.eliminarAsistenciaDocente);

// ─── Rutas del Panel de Preceptoría (Alumnos, Rendimiento y Constancias) ───
router.get('/panel/alumnos', requireAuth, requirePreceptorOAdmin, PreceptoriaController.getAlumnosRendimiento);
router.get('/panel/rendimiento-clases', requireAuth, requirePreceptorOAdmin, PreceptoriaController.getRendimientoClases);
router.get('/constancias', requireAuth, requirePreceptorOAdmin, PreceptoriaController.listarConstancias);
router.put('/constancias/:id', requireAuth, requirePreceptorOAdmin, PreceptoriaController.resolverConstancia);
router.post('/constancias/emitir-directa', requireAuth, requirePreceptorOAdmin, PreceptoriaController.emitirConstanciaDirecta);

// ─── Rutas de Comisiones para el Panel (Preceptor y Administrador) ───
router.get('/mis-clases', requireAuth, requirePreceptorOAdmin, PreceptoriaController.getClasesPreceptor);

router.get(
  '/clases/:claseId/planilla',
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  PreceptoriaController.getPlanillaFecha
);

router.post(
  '/clases/:claseId/asistencia',
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  PreceptoriaController.guardarAsistencia
);

router.get(
  '/clases/:claseId/historial',
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  PreceptoriaController.getHistorial
);

router.get(
  '/clases/:claseId/estadisticas',
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  PreceptoriaController.getEstadisticas
);

// ─── Rutas de Administración Institucional (Gestión de Asignaciones) ───
router.get('/admin/preceptores', requireAuth, requireAdmin, PreceptoriaController.listarPreceptores);
router.post('/admin/asignar-clase', requireAuth, requireAdmin, PreceptoriaController.asignarClase);
router.post('/admin/revocar-clase', requireAuth, requireAdmin, PreceptoriaController.revocarAsignacion);

export default router;

