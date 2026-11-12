import { Request, Response, NextFunction } from 'express';
import pool from '../../../../backend/conexion_pg';

/**
 * Middleware para verificar sesión activa en EduTech-Hub
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado. Inicie sesión en EduTech-Hub para continuar.',
    });
  }

  next();
}

/**
 * Middleware para verificar rol permitido
 */
export function requireRoles(...rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req.session as any)?.usuario;

    if (!usuario) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Middleware que verifica que la clase exista y que el docente esté asignado a ella (o sea administrador).
 */
export async function requireDocenteDeClase(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  const claseId = Number(req.params.claseId);

  if (isNaN(claseId)) {
    return res.status(400).json({ success: false, error: 'ID de clase inválido' });
  }

  try {
    // 1. Verificar si la clase existe
    const claseRes = await pool.query('SELECT id, nombre, titular_id FROM clases WHERE id = $1', [claseId]);
    if (claseRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: `La clase con ID ${claseId} no existe en la institución.` });
    }

    // 2. Administradores y Preceptores tienen acceso institucional de supervisión
    if (usuario.rol === 'admin' || usuario.rol === 'preceptor') {
      return next();
    }

    // 3. Si es profesor, verificar titularidad o asignación explícita
    if (usuario.rol === 'profesor') {
      const clase = claseRes.rows[0];
      if (clase.titular_id === usuario.id) {
        return next();
      }

      const asignacionRes = await pool.query(
        'SELECT id FROM profesores_clases WHERE profesor_id = $1 AND clase_id = $2',
        [usuario.id, claseId]
      );

      if (asignacionRes.rows.length > 0) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'Acceso no autorizado: No eres el profesor asignado a esta comisión.',
      });
    }

    return res.status(403).json({ success: false, error: 'Acceso no autorizado para este rol.' });
  } catch (error) {
    console.error('Error en middleware requireDocenteDeClase:', error);
    return res.status(500).json({ success: false, error: 'Error interno de verificación de permisos' });
  }
}

