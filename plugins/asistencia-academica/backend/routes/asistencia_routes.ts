import { Router } from 'express';
import { AsistenciaController } from '../controllers/asistencia_controller';
import { requireAuth, requireRoles, requireDocenteDeClase } from '../middleware/asistencia_auth';

const router = Router();

// Endpoint público de salud y diagnóstico del plugin
router.get('/health', AsistenciaController.getHealth);

// Endpoints para Preceptores, Profesores y Administradores
router.get(
  '/clases',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  AsistenciaController.getClasesDocente
);

router.get(
  '/clases/:claseId/fechas',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  requireDocenteDeClase,
  AsistenciaController.getFechasClase
);

router.get(
  '/clases/:claseId',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  requireDocenteDeClase,
  AsistenciaController.getPlanillaFecha
);

router.post(
  '/clases/:claseId',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  requireDocenteDeClase,
  AsistenciaController.guardarPlanilla
);

// Endpoints para Actas e Incidencias (Preceptoría)
router.get(
  '/actas/clase/:claseId',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  AsistenciaController.getActasClase
);

router.post(
  '/actas',
  requireAuth,
  requireRoles('admin', 'preceptor'),
  AsistenciaController.crearActa
);

router.put(
  '/actas/:id/estado',
  requireAuth,
  requireRoles('admin', 'preceptor'),
  AsistenciaController.actualizarEstadoActa
);

router.delete(
  '/actas/:id',
  requireAuth,
  requireRoles('admin', 'preceptor'),
  AsistenciaController.eliminarActa
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

