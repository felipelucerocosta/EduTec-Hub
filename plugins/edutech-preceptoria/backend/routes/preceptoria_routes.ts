/**
 * ============================================================================
 * ARCHIVO: preceptoria_routes.ts
 * PLUGIN: EduTech Preceptoría — Control Exclusivo de Asistencia
 * ROL ARQUITECTURAL: Enrutador Express y Matriz de Autorización (Router & RBAC)
 * ============================================================================
 * 
 * RESPONSABILIDAD:
 * Mapea las rutas HTTP del plugin de preceptoría hacia los métodos del controlador,
 * intercalando middlewares de seguridad que garantizan la separación de roles:
 * - Alumnos: Solo consultan su presentismo y solicitan constancias.
 * - Docentes: Consultan su presentismo laboral.
 * - Preceptores: Toman asistencia de comisiones asignadas y expiden constancias.
 * - Administradores: Supervisan comisiones y asignan preceptores a cursos.
 * 
 * PREFIJO GLOBAL:
 * Montado bajo `/api/plugins/edutech-preceptoria` por `PluginRegistry`.
 */

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

// ----------------------------------------------------------------------------
// 1. Diagnóstico y Monitoreo (Público)
// ----------------------------------------------------------------------------
router.get('/health', PreceptoriaController.getHealth);

// ----------------------------------------------------------------------------
// 2. Rutas Informativas para Alumnos (Consulta y Trámites)
// ----------------------------------------------------------------------------
// Consulta de presentismo, porcentaje y estado de regularidad del estudiante
router.get('/mi-asistencia', requireAuth, PreceptoriaController.getMiAsistencia);

// Envío de solicitud de constancia de alumno regular
router.post('/solicitar-constancia', requireAuth, PreceptoriaController.solicitarConstancia);

// ----------------------------------------------------------------------------
// 3. Rutas de Asistencia Laboral Docente (Personal de Profesores)
// ----------------------------------------------------------------------------
// Consulta personal del docente sobre su presentismo laboral
router.get('/mi-asistencia-docente', requireAuth, PreceptoriaController.getMiAsistenciaDocente);

// Nómina de presentismo docente para preceptoría y directivos
router.get('/docentes/asistencias', requireAuth, requirePreceptorOAdmin, PreceptoriaController.listarAsistenciasDocentes);

// Asentar asistencia laboral de un profesor
router.post('/docentes/asistencias', requireAuth, requirePreceptorOAdmin, PreceptoriaController.guardarAsistenciaDocente);

// Eliminar un registro de asistencia docente (exclusivo administración)
router.delete('/docentes/asistencias/:id', requireAuth, requireAdmin, PreceptoriaController.eliminarAsistenciaDocente);

// ----------------------------------------------------------------------------
// 4. Panel de Preceptoría (Alumnos, Rendimiento y Constancias)
// ----------------------------------------------------------------------------
// Nómina de alumnos con métricas de rendimiento académico
router.get('/panel/alumnos', requireAuth, requirePreceptorOAdmin, PreceptoriaController.getAlumnosRendimiento);

// Analítica y promedios generales por comisión escolar
router.get('/panel/rendimiento-clases', requireAuth, requirePreceptorOAdmin, PreceptoriaController.getRendimientoClases);

// Bandeja de solicitudes de constancias de alumno regular
router.get('/constancias', requireAuth, requirePreceptorOAdmin, PreceptoriaController.listarConstancias);

// Aprobación o rechazo de constancias con emisión de código de validación
router.put('/constancias/:id', requireAuth, requirePreceptorOAdmin, PreceptoriaController.resolverConstancia);

// Emisión directa de constancia sin solicitud web previa
router.post('/constancias/emitir-directa', requireAuth, requirePreceptorOAdmin, PreceptoriaController.emitirConstanciaDirecta);

// ----------------------------------------------------------------------------
// 5. Comisiones Asignadas y Toma de Asistencia (Exclusivo Preceptor Asignado)
// ----------------------------------------------------------------------------
// Lista las comisiones que el preceptor tiene asignadas formalmente
router.get('/mis-clases', requireAuth, requirePreceptorOAdmin, PreceptoriaController.getClasesPreceptor);

// Carga de planilla para una fecha escolar determinada
router.get(
  '/clases/:claseId/planilla',
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  PreceptoriaController.getPlanillaFecha
);

// Asentar o actualizar la toma de asistencia transaccional
router.post(
  '/clases/:claseId/asistencia',
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  PreceptoriaController.guardarAsistencia
);

// Historial de asistencias registradas por comisión
router.get(
  '/clases/:claseId/historial',
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  PreceptoriaController.getHistorial
);

// Estadísticas de presentismo por comisión
router.get(
  '/clases/:claseId/estadisticas',
  requireAuth,
  requireExclusivoPreceptor,
  requirePreceptorAsignadoAClase,
  PreceptoriaController.getEstadisticas
);

// ----------------------------------------------------------------------------
// 6. Asignaciones Institucionales (Exclusivo Administración General)
// ----------------------------------------------------------------------------
// Listado de preceptores y cantidad de comisiones a su cargo
router.get('/admin/preceptores', requireAuth, requireAdmin, PreceptoriaController.listarPreceptores);

// Asignar un preceptor a una comisión escolar
router.post('/admin/asignar-clase', requireAuth, requireAdmin, PreceptoriaController.asignarClase);

// Revocar la asignación de un preceptor sobre una comisión
router.post('/admin/revocar-clase', requireAuth, requireAdmin, PreceptoriaController.revocarAsignacion);

export default router;
