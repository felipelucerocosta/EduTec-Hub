import 'express-session';

declare module 'express-session' {
  interface UsuarioSession {
    id: number;
    nombre: string;
    correo: string;
    rol: 'alumno' | 'profesor' | 'admin' | string;
    estado_acceso?: 'ACTIVO' | 'PENDIENTE_DE_ASIGNACION' | 'SUSPENDIDO' | string;
    isAdmin?: boolean;
  }

  interface SessionData {
    usuario?: UsuarioSession;
    nombre_completo?: string;
    alumno_id?: number;
  }
}
