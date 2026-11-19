export const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
// Usar ruta relativa /api permite que el proxy de Vite en desarrollo o Express en producción
// manejen las cookies de sesión en el mismo origen (same-origin), garantizando persistencia total con F5.
export const API_URL: string = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL: string = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');

