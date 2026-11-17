/**
 * ============================================================================
 * ARCHIVO: preceptoria_auth.ts
 * PLUGIN: EduTech Preceptoría — Control Exclusivo de Asistencia
 * ROL ARQUITECTURAL: Middlewares de Autorización y Seguridad (Guardas de Acceso)
 * ============================================================================
 * 
 * RESPONSABILIDAD:
 * Este archivo implementa el modelo de Control de Acceso Basado en Roles (RBAC)
 * para el subsistema de preceptoría.
 * 
 * POLÍTICAS INSTITUCIONALES PROTEGIDAS:
 * 1. Exclusividad del Preceptor: La toma y modificación de asistencia diaria es
 *    potestad indelegable del Preceptor. Ni administradores, ni docentes, ni alumnos
 *    pueden alterar las planillas de presentismo directamente.
 * 2. Asignación de Comisiones: Un preceptor únicamente puede registrar asistencia
 *    en las comisiones que la dirección le haya asignado formalmente en la tabla
 *    `preceptores_clases`.
 * 3. Consultas Directivas: Los directivos/administradores poseen permisos de sólo
 *    lectura para supervisar y auditar la regularidad institucional.
 */

import { Request, Response, NextFunction } from 'express';
import pool from '../../../../backend/conexion_pg';

/**
 * Middleware: requireAuth
 * Verifica que el cliente posea una sesión HTTP activa válida.
 * Si no está autenticado, responde HTTP 401 Unauthorized.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  if (!usuario || !usuario.id) {
    return res.status(401).json({ success: false, error: 'No autenticado. Inicie sesión en EduTech.' });
  }
  next();
}

/**
 * Middleware Estricto: requireExclusivoPreceptor
 * Exclusivo para el rol Preceptor.
 * Los administradores administran permisos y asignaciones, pero no pueden tomar asistencia.
 * Los profesores y alumnos tampoco tienen permiso para registrar asistencias escolares.
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
 * Middleware: requireAdmin
 * Acceso reservado a la dirección escolar y administradores del sistema
 * para la asignación y revocación de cursos a preceptores.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  if (!usuario || (usuario.rol !== 'admin' && !usuario.isAdmin)) {
    return res.status(403).json({ success: false, error: 'Acceso restringido a administradores institucionales.' });
  }
  next();
}

/**
 * Middleware: requirePreceptorOAdmin
 * Permite acceso a preceptores o directivos para consultar nóminas de alumnos,
 * métricas de rendimiento por comisión y expedición de constancias de alumno regular.
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
 * Middleware: requirePreceptorAsignadoAClase
 * Verifica en la base de datos relacional que el preceptor autenticado esté
 * expresamente asignado a la comisión especificada en `req.params.claseId`.
 * Previene que un preceptor altere los registros de cursos a cargo de otro colega.
 */
export async function requirePreceptorAsignadoAClase(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  const claseId = Number(req.params.claseId);

  if (isNaN(claseId)) {
    return res.status(400).json({ success: false, error: 'ID de comisión inválido.' });
  }

  // Bypass para directivos/administradores (supervisión y auditoría institucional)
  if (usuario && (usuario.rol === 'admin' || usuario.isAdmin)) {
    return next();
  }

  if (!usuario || !['preceptor', 'preceptoria'].includes(String(usuario.rol).toLowerCase().trim())) {
    return res.status(403).json({
      success: false,
      error: 'Operación no permitida: Solo preceptores autorizados o administradores pueden acceder a esta comisión.',
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
        error: `Acceso no autorizado: No estás asignado como preceptor a la comisión con ID ${claseId}. Contacta a la Dirección para su asignación.`,
      });
    }

    next();
  } catch (err) {
    console.error('Error al verificar asignación de preceptor:', err);
    return res.status(500).json({ success: false, error: 'Error interno de verificación de asignación.' });
  }
}
