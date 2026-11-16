/**
 * ============================================================================
 * ARCHIVO: oportunidades_routes.ts
 * PLUGIN: EduTech Oportunidades — Portal de Pasantías y Proyectos
 * ROL ARQUITECTURAL: Enrutador Express y Guardas de Acceso (Routing & Middleware)
 * ============================================================================
 * 
 * RESPONSABILIDAD:
 * Define la tabla de rutas HTTP REST expuestas por el plugin y las funciones
 * interceptoras (middlewares) de autenticación y autorización por rol.
 * 
 * MONTAJE GLOBAL:
 * Este router es exportado como propiedad del plugin y montado en Express bajo
 * la ruta base:
 *   /api/plugins/edutech-oportunidades
 * 
 * SEGURIDAD:
 * Ninguna ruta crítica (crear, postularse, evaluar) puede ser invocada sin una
 * sesión activa válida en `req.session.usuario`.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { OportunidadesController } from '../controllers/oportunidades_controller';

const router = Router();

/**
 * ----------------------------------------------------------------------------
 * MIDDLEWARE: requireAuth
 * ----------------------------------------------------------------------------
 * Verifica que la petición provenga de un cliente con sesión activa iniciada.
 * Si no existe el objeto usuario en la sesión, corta la ejecución con HTTP 401.
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const usuario = (req.session as any)?.usuario;
  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión en EduTech.' });
  }
  next();
};

/**
 * ----------------------------------------------------------------------------
 * MIDDLEWARE FACTORY: requireRoles(...roles)
 * ----------------------------------------------------------------------------
 * Retorna una función interceptora que restringe el acceso exclusivamente a
 * los roles enumerados en los argumentos (ej. 'alumno', 'profesor', 'admin').
 * Si el rol del usuario conectado no coincide, retorna HTTP 403 Forbidden.
 */
const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req.session as any)?.usuario;
    if (!usuario) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(usuario.rol)) {
      return res.status(403).json({ error: `Acceso restringido para el rol: ${usuario.rol}` });
    }
    next();
  };
};

// ----------------------------------------------------------------------------
// 1. Diagnóstico y Monitoreo (Sin autenticación requerida)
// ----------------------------------------------------------------------------
router.get('/health', OportunidadesController.getHealth);

// ----------------------------------------------------------------------------
// 2. Catálogo Público de Convocatorias (Acceso general autenticado)
// ----------------------------------------------------------------------------
// Listado filtrable de convocatorias para alumnos, profesores y directivos
router.get('/oportunidades', requireAuth, OportunidadesController.listarOportunidades);

// Ficha de detalle de una oportunidad específica por su ID
router.get('/oportunidades/:id', requireAuth, OportunidadesController.obtenerDetalle);

// ----------------------------------------------------------------------------
// 3. Creación y Edición de Convocatorias (Profesores, Preceptores y Administradores)
// ----------------------------------------------------------------------------
// Publicación de una nueva pasantía o proyecto técnico
router.post(
  '/oportunidades',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.crearOportunidad
);

// Modificación de datos de una convocatoria existente (autor o administrador)
router.put(
  '/oportunidades/:id',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.modificarOportunidad
);

// ----------------------------------------------------------------------------
// 4. Ciclo de Postulación del Alumno (Exclusivo para Estudiantes)
// ----------------------------------------------------------------------------
// Enviar postulación formal con carta de motivación y disponibilidad
router.post(
  '/oportunidades/:id/postular',
  requireAuth,
  requireRoles('alumno'),
  OportunidadesController.postularse
);

// Consultar el estado de las postulaciones enviadas por el alumno logueado
router.get(
  '/mis-postulaciones',
  requireAuth,
  requireRoles('alumno'),
  OportunidadesController.misPostulaciones
);

// Cancelación voluntaria de una postulación pendiente
router.delete(
  '/postulaciones/:id',
  requireAuth,
  requireRoles('alumno'),
  OportunidadesController.cancelarPostulacion
);

// ----------------------------------------------------------------------------
// 5. Gestión y Resolución de Aspirantes (Responsables y Administradores)
// ----------------------------------------------------------------------------
// Ver todos los alumnos postulados a una convocatoria con sus perfiles
router.get(
  '/oportunidades/:id/postulantes',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.verPostulantes
);

// Cambiar el estado de postulación (aceptada, rechazada, entrevista, etc.) y enviar notificación
router.put(
  '/postulaciones/:id/estado',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.actualizarEstadoPostulacion
);

// ----------------------------------------------------------------------------
// 6. Métricas y Telemetría Institucional
// ----------------------------------------------------------------------------
// Resumen de convocatorias creadas, vacantes cubiertas y aspirantes procesados
router.get(
  '/metricas',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  OportunidadesController.getMetricas
);

export default router;
