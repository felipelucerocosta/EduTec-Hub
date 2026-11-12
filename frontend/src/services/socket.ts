import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config/api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Conectado al bus de eventos Socket.IO');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Desconectado de Socket.IO');
    });
  }

  return socket;
}

/**
 * Une el socket a la sala de una clase.
 */
export function joinClassRoom(claseId: string | number) {
  const s = getSocket();
  if (s.connected) {
    s.emit('join_class', claseId);
  } else {
    s.once('connect', () => {
      s.emit('join_class', claseId);
    });
  }
}

/**
 * Abandona la sala de una clase.
 */
export function leaveClassRoom(claseId: string | number) {
  const s = getSocket();
  if (s.connected) {
    s.emit('leave_class', claseId);
  }
}

/**
 * Suscribe el socket al canal privado del usuario logueado.
 */
export function joinUserRoom(userId: string | number) {
  const s = getSocket();
  if (s.connected) {
    s.emit('join_user', userId);
  } else {
    s.once('connect', () => {
      s.emit('join_user', userId);
    });
  }
}

/**
 * Suscribe el socket al canal de administración si es admin.
 */
export function joinAdminRoom() {
  const s = getSocket();
  if (s.connected) {
    s.emit('join_admin');
  } else {
    s.once('connect', () => {
      s.emit('join_admin');
    });
  }
}

