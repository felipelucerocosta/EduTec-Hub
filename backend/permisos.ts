import type { Request, Response, NextFunction } from 'express';
import pool from './conexion_pg';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  correo: string;
  rol: 'alumno' | 'profesor' | 'admin';
  estado_acceso?: string;
  isAdmin?: boolean;
}

/**
 * Verifica si un usuario tiene acceso legítimo a una clase específica.
 * - Admin: acceso total.
 * - Profesor: acceso si es titular_id o está en profesores_clases.
 * - Alumno: acceso si está inscripto en alumnos_clases (asociado al código de la clase).
 */
export async function verificarAccesoClase(
  usuario: UsuarioSesion | undefined,
  claseId: number | string
): Promise<{ permitido: boolean; clase?: any; motivo?: string }> {
  if (!usuario || !usuario.id) {
    return { permitido: false, motivo: 'Usuario no autenticado.' };
  }

  const numericClaseId = Number(claseId);
  if (isNaN(numericClaseId) || numericClaseId <= 0) {
    return { permitido: false, motivo: 'ID de clase inválido.' };
  }

  try {
    const claseRes = await pool.query('SELECT * FROM clases WHERE id = $1 LIMIT 1', [numericClaseId]);
    if (!claseRes.rows || claseRes.rows.length === 0) {
      return { permitido: false, motivo: 'Clase no encontrada.' };
    }
    const clase = claseRes.rows[0];

    // 1. Admin siempre tiene acceso
    if (usuario.rol === 'admin' || usuario.isAdmin) {
      return { permitido: true, clase };
    }

    // 2. Profesor
    if (usuario.rol === 'profesor') {
      if (clase.titular_id === usuario.id) {
        return { permitido: true, clase };
      }
      // Verificar también tabla profesores_clases si existe
      try {
        const pcRes = await pool.query(
          'SELECT id FROM profesores_clases WHERE profesor_id = $1 AND clase_id = $2 LIMIT 1',
          [usuario.id, numericClaseId]
        );
        if (pcRes.rows && pcRes.rows.length > 0) {
          return { permitido: true, clase };
        }
      } catch (_e) {}

      return { permitido: false, motivo: 'No estás asignado como profesor a esta clase.' };
    }

    // 3. Alumno
    if (usuario.rol === 'alumno') {
      const codigoClase = String(clase.codigo || '').trim().toLowerCase();
      const acRes = await pool.query(
        'SELECT id FROM alumnos_clases WHERE alumno_id = $1 AND LOWER(TRIM(codigo)) = $2 LIMIT 1',
        [usuario.id, codigoClase]
      );
      if (acRes.rows && acRes.rows.length > 0) {
        return { permitido: true, clase };
      }
      return { permitido: false, motivo: 'No estás inscripto en esta clase.' };
    }

    return { permitido: false, motivo: 'Rol de usuario no autorizado.' };
  } catch (error) {
    console.error('Error al verificar acceso a clase:', error);
    return { permitido: false, motivo: 'Error interno de verificación de permisos.' };
  }
}

/**
 * Middleware Express para proteger rutas que reciben :claseId como parámetro de ruta
 */
export function requireClaseParamAccess(req: Request, res: Response, next: NextFunction) {
  const claseId = req.params.claseId || req.params.id;
  const usuario = req.session?.usuario as UsuarioSesion | undefined;

  if (!usuario) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  verificarAccesoClase(usuario, claseId).then(({ permitido, motivo }) => {
    if (!permitido) {
      return res.status(403).json({ error: motivo || 'Acceso denegado a esta clase.' });
    }
    next();
  }).catch((err) => {
    console.error('Error en middleware requireClaseParamAccess:', err);
    return res.status(500).json({ error: 'Error al verificar permisos.' });
  });
}
