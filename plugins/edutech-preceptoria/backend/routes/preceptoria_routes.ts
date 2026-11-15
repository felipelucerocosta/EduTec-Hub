import { Router } from 'express';
import { PreceptoriaController } from '../controllers/preceptoria_controller';
import {
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  requireAdmin,
} from '../middleware/preceptoria_auth';

const router = Router();

// Diagnóstico
router.get('/health', PreceptoriaController.getHealth);

// Rutas de Preceptores
router.get('/mis-clases', requireAuth, requireExclusivoPreceptor, PreceptoriaController.getClasesPreceptor);

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

// Rutas de Administración Institucional (Gestión de Asignaciones)
router.get('/admin/preceptores', requireAuth, requireAdmin, PreceptoriaController.listarPreceptores);
router.post('/admin/asignar-clase', requireAuth, requireAdmin, PreceptoriaController.asignarClase);
router.post('/admin/revocar-clase', requireAuth, requireAdmin, PreceptoriaController.revocarAsignacion);

export default router;

