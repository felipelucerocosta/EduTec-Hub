import { Router, Request, Response, NextFunction } from 'express';
import { AulaActivaController } from '../controllers/aula_activa_controller';

const router = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const usuario = (req.session as any)?.usuario;
  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }
  next();
};

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

router.get('/health', AulaActivaController.getHealth);

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

router.post(
  '/trabajos/:trabajoId/entregar',
  requireAuth,
  requireRoles('alumno'),
  AulaActivaController.entregarTrabajo
);

router.post(
  '/entregas/:entregaId/calificar',
  requireAuth,
  requireRoles('profesor', 'admin'),
  AulaActivaController.calificarEntrega
);

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

router.get(
  '/clases/:claseId/metricas',
  requireAuth,
  requireRoles('profesor', 'admin', 'preceptor'),
  AulaActivaController.getMetricasClase
);

export default router;

