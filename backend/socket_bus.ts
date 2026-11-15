import type { Server as SocketIOServer, Socket } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(instance: SocketIOServer) {
  ioInstance = instance;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

function envelope(data: any) {
  const base = data && typeof data === 'object' && !Array.isArray(data) ? data : { payload: data };
  return {
    ...base,
    _rt: {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      ts: Date.now(),
    },
  };
}

export function classRoom(claseId: string | number) {
  return `clase_${claseId}`;
}

export function userRoom(userId: string | number) {
  return `user_${userId}`;
}

export function roleRoom(rol: string) {
  return `role_${rol}`;
}

export function conversationRoom(conversationId: string | number) {
  return `conv_${conversationId}`;
}

export function simulationRoom(simId: string | number) {
  return `sim_${simId}`;
}

export function emitToClass(claseId: string | number, event: string, data: any) {
  if (!ioInstance || claseId === undefined || claseId === null || claseId === '') return;
  ioInstance.to(classRoom(claseId)).emit(event, envelope(data));
}

export function emitToUser(userId: string | number, event: string, data: any) {
  if (!ioInstance || userId === undefined || userId === null || userId === '') return;
  ioInstance.to(userRoom(userId)).emit(event, envelope(data));
}

export function emitToUsers(userIds: Array<string | number>, event: string, data: any) {
  if (!ioInstance || !userIds?.length) return;
  const payload = envelope(data);
  for (const id of userIds) {
    if (id === undefined || id === null || id === '') continue;
    ioInstance.to(userRoom(id)).emit(event, payload);
  }
}

export function emitToAdmin(event: string, data: any) {
  if (!ioInstance) return;
  ioInstance.to('admin_channel').emit(event, envelope(data));
}

export function emitToRole(rol: string, event: string, data: any) {
  if (!ioInstance || !rol) return;
  ioInstance.to(roleRoom(rol)).emit(event, envelope(data));
}

export function emitToConversation(conversationId: string | number, event: string, data: any) {
  if (!ioInstance || conversationId === undefined || conversationId === null) return;
  ioInstance.to(conversationRoom(conversationId)).emit(event, envelope(data));
}

export function emitToSimulation(simId: string | number, event: string, data: any) {
  if (!ioInstance || simId === undefined || simId === null) return;
  ioInstance.to(simulationRoom(simId)).emit(event, envelope(data));
}

/**
 * Avisos institucionales o catálogos públicos para usuarios autenticados.
 * No usar para datos privados de una clase.
 */
export function emitToAuthenticated(event: string, data: any) {
  emitToRole('alumno', event, data);
  emitToRole('profesor', event, data);
  emitToRole('admin', event, data);
  emitToRole('preceptor', event, data);
}

export async function addSocketToClass(socket: Socket, claseId: string | number) {
  await socket.join(classRoom(claseId));
}

export async function removeSocketFromClass(socket: Socket, claseId: string | number) {
  await socket.leave(classRoom(claseId));
}
