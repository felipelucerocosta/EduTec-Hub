import type { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(instance: SocketIOServer) {
  ioInstance = instance;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Emite un evento a todos los usuarios conectados a la sala de una clase.
 */
export function emitToClass(claseId: string | number, event: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`clase_${claseId}`).emit(event, data);
  }
}

/**
 * Emite un evento privado al canal de un usuario específico.
 */
export function emitToUser(userId: string | number, event: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit(event, data);
  }
}

/**
 * Emite un evento al canal de administradores.
 */
export function emitToAdmin(event: string, data: any) {
  if (ioInstance) {
    ioInstance.to('admin_channel').emit(event, data);
  }
}

/**
 * Emite un evento global a todos los clientes conectados.
 */
export function emitGlobal(event: string, data: any) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

