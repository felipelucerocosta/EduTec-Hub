import 'express-session';

declare module 'express-session' {
  interface UsuarioSession {
    id: number;
    nombre: string;
    correo: string;
    rol: 'alumno' | 'profesor' | 'admin' | string;
    isAdmin?: boolean;
  }

  interface SessionData {
    usuario?: UsuarioSession;
    nombre_completo?: string;
    alumno_id?: number;
  }
}
