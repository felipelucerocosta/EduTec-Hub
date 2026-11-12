import { Router } from 'express';
import { OportunidadesController } from '../controllers/oportunidades_controller';
import { requireAuth, requireRoles } from '../../../asistencia-academica/backend/middleware/asistencia_auth';

const router = Router();

// Health check
router.get('/health', OportunidadesController.getHealth);

// Catálogo público de oportunidades (acceso para cualquier usuario autenticado)
router.get('/oportunidades', requireAuth, OportunidadesController.listarOportunidades);
router.get('/oportunidades/:id', requireAuth, OportunidadesController.obtenerDetalle);

// Creación y edición (profesor, admin, preceptor institucional)
router.post(
  '/oportunidades',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.crearOportunidad
);

router.put(
  '/oportunidades/:id',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.modificarOportunidad
);

// Postulaciones de Alumnos
router.post(
  '/oportunidades/:id/postular',
  requireAuth,
  requireRoles('alumno'),
  OportunidadesController.postularse
);

router.get(
  '/mis-postulaciones',
  requireAuth,
  requireRoles('alumno'),
  OportunidadesController.misPostulaciones
);

router.delete(
  '/postulaciones/:id',
  requireAuth,
  requireRoles('alumno'),
  OportunidadesController.cancelarPostulacion
);

// Gestión de postulantes por el Responsable / Admin
router.get(
  '/oportunidades/:id/postulantes',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.verPostulantes
);

router.put(
  '/postulaciones/:id/estado',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.actualizarEstadoPostulacion
);

// Métricas de responsables
router.get(
  '/metricas',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.getMetricas
);

export default router;
