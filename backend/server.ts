import Module from 'module';
import path from 'path';

// Asegurar que plugins y módulos externos (ej. /plugins) compartan y resuelvan las dependencias
// del backend principal (Express, etc.) sin necesidad de duplicar paquetes en cada plugin.
const backendNodeModules = path.join(__dirname, 'node_modules');
const origResolveFilename = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  try {
    return origResolveFilename.call(this, request, parent, isMain, options);
  } catch (err: any) {
    if (err && err.code === 'MODULE_NOT_FOUND' && !request.startsWith('.') && !request.startsWith('/') && !request.includes(':')) {
      try {
        const fallbackPath = path.join(backendNodeModules, request);
        return origResolveFilename.call(this, fallbackPath, parent, isMain, options);
      } catch (_) {}
    }
    throw err;
  }
};
if (!(Module as any).globalPaths.includes(backendNodeModules)) {
  (Module as any).globalPaths.push(backendNodeModules);
}

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import * as dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || path.join(__dirname, '.env') });

function interop(m: any) { return m && (m.default ?? m); }

// --- 1. IMPORTAR LOS ARCHIVOS DE RUTAS ---
const apiRutasRouter = interop(require('./api_rutas'));
const mensajesRouter = interop(require('./mensajes'));
const registroRouter = interop(require('./registro'));
const loginRouter    = interop(require('./login'));
const alfredRouter   = interop(require('./alfred'));

const crearClaseRouter         = interop(require('./crear_clase'));
const unirseClaseRouter        = interop(require('./unirse_clase'));
const obtenerClasesRouter      = interop(require('./obtener_clases'));
const obtenerClasesAlumnoRouter = interop(require('./obtener_clases_alumno'));
const obtenerClasesProfRouter   = interop(require('./obtener_clases_prof'));

const trabajosRouter      = interop(require('./trabajos'));
const entregasRouter      = interop(require('./entregas'));
const materialesApiRouter = interop(require('./materiales_api'));
const notificacionesRouter = interop(require('./notificaciones'));
const rendimientoRouter    = interop(require('./rendimiento'));
const boletinRouter        = interop(require('./boletin'));
const simuladoresApiRouter = interop(require('./simuladores_api'));
const adminApiRouter       = interop(require('./admin_api'));
const pluginRegistry       = interop(require('../plugins/index'));

const setupDb = interop(require('./setup_db'));

// --- 2. INICIALIZAR LA APP Y SOCKET.IO ---
const app = express();
const httpServer = http.createServer(app);

const PORT: number = Number(process.env.PORT) || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Función helper de validación de origen CORS para desarrollo
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return false;
};

import { setSocketIO } from './socket_bus';

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(null, false);
    },
    credentials: true
  }
});

setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`🔌 Cliente Socket.IO conectado: ${socket.id}`);

  socket.on('join_class', (claseId: string | number) => {
    if (claseId) {
      const room = `clase_${claseId}`;
      socket.join(room);
      console.log(`📡 Socket ${socket.id} unido a ${room}`);
    }
  });

  socket.on('leave_class', (claseId: string | number) => {
    if (claseId) {
      const room = `clase_${claseId}`;
      socket.leave(room);
      console.log(`📡 Socket ${socket.id} abandonó ${room}`);
    }
  });

  socket.on('join_user', (userId: string | number) => {
    if (userId) {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`📡 Socket ${socket.id} suscrito a canal de usuario ${room}`);
    }
  });

  socket.on('join_admin', () => {
    socket.join('admin_channel');
    console.log(`📡 Socket ${socket.id} suscrito a admin_channel`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente Socket.IO desconectado: ${socket.id}`);
  });
});

// --- 3. CONFIGURAR MIDDLEWARE ---
// En producción el frontend se sirve desde este mismo servidor (sin CORS cross-origin)
if (!IS_PRODUCTION) {
  app.use(cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error('Bloqueado por CORS: origen no permitido.'));
    },
    credentials: true
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos subidos por usuarios
const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Archivos del frontend (solo en producción)
if (IS_PRODUCTION) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'una-clave-muy-secreta-y-larga',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,          // false incluso en producción Electron (HTTP local)
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días
  }
}));

// --- 4. RUTAS DE LA API ---
app.use('/api', mensajesRouter);
app.use('/api', registroRouter);
app.use('/api', loginRouter);
app.use('/api', apiRutasRouter);
app.use('/api', alfredRouter);
app.use('/api', crearClaseRouter);
app.use('/api', unirseClaseRouter);
app.use('/api', obtenerClasesRouter);
app.use('/api', obtenerClasesAlumnoRouter);
app.use('/api', obtenerClasesProfRouter);
app.use('/api', trabajosRouter);
app.use('/api', entregasRouter);
app.use('/api', materialesApiRouter);
app.use('/api', notificacionesRouter);
app.use('/api', rendimientoRouter);
app.use('/api', boletinRouter);
app.use('/api', simuladoresApiRouter);
app.use('/api', adminApiRouter);

// --- 4.1. MONTAR PLUGINS DEL SISTEMA ---
if (pluginRegistry && typeof pluginRegistry.mountAll === 'function') {
  pluginRegistry.mountAll(app).catch((err: any) => {
    console.error('❌ [Plugin Registry] Error al inicializar plugins:', err);
  });
}

// Ruta base — en producción sirve el index.html del frontend (SPA fallback)
if (IS_PRODUCTION) {
  app.get('*', (_req: Request, res: Response) => {
    const distPath = path.join(__dirname, '../dist', 'index.html');
    res.sendFile(distPath);
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.send('Servidor del Backend de EduTecHub funcionando!');
  });
}

// --- 5. INICIALIZAR TABLAS Y ARRANCAR ---
setupDb();

httpServer.listen(PORT, () => {
  console.log(`✅ Servidor del Backend (con Socket.IO) corriendo en http://localhost:${PORT}`);
});

