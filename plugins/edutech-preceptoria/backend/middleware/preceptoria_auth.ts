import { Request, Response, NextFunction } from 'express';
import pool from '../../../../backend/conexion_pg';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  if (!usuario || !usuario.id) {
    return res.status(401).json({ success: false, error: 'No autenticado. Inicie sesión en EduTech.' });
  }
  next();
}

/**
 * Middleware Estricto: Exclusivo para el Rol Preceptor
 * Los administradores administran permisos y asignaciones, pero no pueden tomar asistencia.
 * Los profesores y alumnos tampoco tienen permiso para registrar asistencias.
 */
export function requireExclusivoPreceptor(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;

  if (!usuario) {
    return res.status(401).json({ success: false, error: 'No autenticado' });
  }

  if (usuario.rol !== 'preceptor') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado: La toma y modificación de asistencia está reservada exclusivamente al rol Preceptor.',
    });
  }

  next();
}

/**
 * Middleware para administradores (gestión de asignaciones de preceptores)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  if (!usuario || (usuario.rol !== 'admin' && !usuario.isAdmin)) {
    return res.status(403).json({ success: false, error: 'Acceso restringido a administradores institucionales.' });
  }
  next();
}

/**
 * Middleware para Preceptor o Administrador (consultas académicas y constancias)
 */
export function requirePreceptorOAdmin(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  if (!usuario) {
    return res.status(401).json({ success: false, error: 'No autenticado' });
  }
  if (usuario.rol !== 'preceptor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado: Se requiere rol de Preceptor o Administrador.',
    });
  }
  next();
}

/**
 * Verifica que el preceptor esté asignado a la comisión especificada
 */
export async function requirePreceptorAsignadoAClase(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  const claseId = Number(req.params.claseId);

  if (isNaN(claseId)) {
    return res.status(400).json({ success: false, error: 'ID de comisión inválido.' });
  }

  if (usuario.rol !== 'preceptor') {
    return res.status(403).json({
      success: false,
      error: 'Operación no permitida: Solo preceptores autorizados pueden gestionar esta comisión.',
    });
  }

  try {
    const q = await pool.query(
      `SELECT id FROM preceptores_clases WHERE preceptor_id = $1 AND clase_id = $2`,
      [usuario.id, claseId]
    );

    if (q.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: `Acceso no autorizado: No estás asignado como preceptor a la comisión con ID ${claseId}.`,
      });
    }

    next();
  } catch (err) {
    console.error('Error al verificar asignación de preceptor:', err);
    return res.status(500).json({ success: false, error: 'Error interno de verificación de asignación.' });
  }
}

