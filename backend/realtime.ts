import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { RequestHandler } from 'express';
import { verificarAccesoClase, type UsuarioSesion } from './permisos';
import { getClassIdsForUser } from './realtime_rooms';
import { classRoom, roleRoom, userRoom } from './socket_bus';

function sessionUser(socket: Socket): UsuarioSesion | undefined {
  const req = socket.request as any;
  return req?.session?.usuario;
}

async function joinAuthorizedRooms(socket: Socket, usuario: UsuarioSesion) {
  socket.data.user = usuario;
  await socket.join(userRoom(usuario.id));
  if (usuario.rol) {
    await socket.join(roleRoom(usuario.rol));
  }
  if (usuario.rol === 'admin' || usuario.isAdmin) {
    await socket.join('admin_channel');
  }

  const classIds = await getClassIdsForUser(usuario);
  for (const id of classIds) {
    await socket.join(classRoom(id));
  }
}

export function attachRealtime(io: SocketIOServer, sessionMiddleware: RequestHandler) {
  io.engine.use((req: any, res: any, next: any) => {
    sessionMiddleware(req, res, next);
  });

  io.on('connection', async (socket) => {
    const usuario = sessionUser(socket);
    if (!usuario?.id) {
      socket.emit('auth_required');
      socket.disconnect(true);
      return;
    }

    try {
      await joinAuthorizedRooms(socket, usuario);
    } catch (err) {
      console.error('Error al suscribir salas autorizadas:', err);
      socket.disconnect(true);
      return;
    }

    socket.on('join_class', async (claseId: string | number) => {
      const user = sessionUser(socket) || socket.data.user;
      const { permitido } = await verificarAccesoClase(user, claseId);
      if (permitido) {
        await socket.join(classRoom(claseId));
      }
    });

    socket.on('leave_class', async (claseId: string | number) => {
      if (claseId === undefined || claseId === null || claseId === '') return;
      await socket.leave(classRoom(claseId));
    });

    socket.on('join_user', async (userId: string | number) => {
      const user = sessionUser(socket) || socket.data.user;
      if (user && Number(user.id) === Number(userId)) {
        await socket.join(userRoom(user.id));
      }
    });

    socket.on('join_admin', async () => {
      const user = sessionUser(socket) || socket.data.user;
      if (user && (user.rol === 'admin' || user.isAdmin)) {
        await socket.join('admin_channel');
      }
    });

    socket.on('resync', async () => {
      const user = sessionUser(socket);
      if (!user?.id) {
        socket.emit('auth_required');
        socket.disconnect(true);
        return;
      }
      try {
        await joinAuthorizedRooms(socket, user);
        socket.emit('resync_ok');
      } catch (_e) {
        socket.emit('auth_required');
      }
    });
  });
}
