import { Router } from 'express';
import { AulaActivaController } from '../controllers/aula_activa_controller';
import { requireAuth, requireRoles } from '../../../asistencia-academica/backend/middleware/asistencia_auth';

const router = Router();

// ─── Health check ───
router.get('/health', AulaActivaController.getHealth);

// ─── Trabajos (tareas) de una clase ───
router.get(
  '/clases/:claseId/trabajos',
  requireAuth,
  requireRoles('profesor', 'admin', 'alumno', 'preceptor'),
  AulaActivaController.getTrabajos
);

router.post(
  '/clases/:claseId/trabajos',
  requireAuth,
  requireRoles('profesor', 'admin'),
  AulaActivaController.crearTrabajo
);

router.put(
  '/trabajos/:trabajoId',
  requireAuth,
  requireRoles('profesor', 'admin'),
  AulaActivaController.modificarTrabajo
);

router.delete(
  '/trabajos/:trabajoId',
  requireAuth,
  requireRoles('profesor', 'admin'),
  AulaActivaController.eliminarTrabajo
);

router.get(
  '/trabajos/:trabajoId/entregas',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  AulaActivaController.getEntregasTrabajo
);

router.get(
  '/clases/:claseId/metricas',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  AulaActivaController.getMetricasClase
);

// ─── Entregas ───
router.post(
  '/trabajos/:trabajoId/entregar',
  requireAuth,
  requireRoles('alumno'),
  AulaActivaController.entregarTrabajo
);

// ─── Calificación ───
router.post(
  '/entregas/:entregaId/calificar',
  requireAuth,
  requireRoles('profesor', 'admin'),
  AulaActivaController.calificarEntrega
);

// ─── Consultas pedagógicas ───
router.get(
  '/clases/:claseId/consultas',
  requireAuth,
  requireRoles('profesor', 'admin', 'alumno', 'preceptor'),
  AulaActivaController.getConsultas
);

router.post(
  '/clases/:claseId/consultas',
  requireAuth,
  requireRoles('profesor', 'admin', 'alumno', 'preceptor'),
  AulaActivaController.publicarConsulta
);

export default router;

