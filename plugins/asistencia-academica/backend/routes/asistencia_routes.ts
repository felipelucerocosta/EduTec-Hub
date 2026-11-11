import { Router } from 'express';
import { AsistenciaController } from '../controllers/asistencia_controller';
import { requireAuth, requireRoles, requireDocenteDeClase } from '../middleware/asistencia_auth';

const router = Router();

// Endpoint público de salud y diagnóstico del plugin
router.get('/health', AsistenciaController.getHealth);

// Endpoints para Profesores y Administradores
router.get(
  '/clases',
  requireAuth,
  requireRoles('profesor', 'admin'),
  AsistenciaController.getClasesDocente
);

router.get(
  '/clases/:claseId/fechas',
  requireAuth,
  requireRoles('profesor', 'admin'),
  requireDocenteDeClase,
  AsistenciaController.getFechasClase
);

router.get(
  '/clases/:claseId',
  requireAuth,
  requireRoles('profesor', 'admin'),
  requireDocenteDeClase,
  AsistenciaController.getPlanillaFecha
);

router.post(
  '/clases/:claseId',
  requireAuth,
  requireRoles('profesor', 'admin'),
  requireDocenteDeClase,
  AsistenciaController.guardarPlanilla
);

// Endpoints para Estudiantes (y Admins en modo auditoría)
router.get(
  '/alumno/resumen',
  requireAuth,
  requireRoles('alumno', 'admin'),
  AsistenciaController.getResumenAlumno
);

router.get(
  '/alumno/clase/:claseId',
  requireAuth,
  requireRoles('alumno', 'admin'),
  AsistenciaController.getDetalleAlumno
);

// Endpoints exclusivos de Supervisión Institucional (Admin)
router.get(
  '/admin/estadisticas',
  requireAuth,
  requireRoles('admin'),
  AsistenciaController.getEstadisticasAdmin
);

export default router;

