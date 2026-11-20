import Module from 'module';
import path from 'path';
import fs from 'fs';

// Asegurar que plugins y módulos externos (ej. /plugins) compartan y resuelvan las dependencias
// del backend principal (Express, etc.) tanto en desarrollo como en distribución compilada o Electron.
const candidateNodeModules = [
  path.join(__dirname, 'node_modules'),
  path.join(__dirname, '../node_modules'),
  path.join(__dirname, '../../backend/node_modules'),
  path.resolve(process.cwd(), 'backend/node_modules'),
  path.resolve(process.cwd(), 'node_modules'),
].filter(p => fs.existsSync(p));

process.env.NODE_PATH = candidateNodeModules.join(path.delimiter);
if (typeof (Module as any)._initPaths === 'function') {
  (Module as any)._initPaths();
}

const origResolveFilename = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  try {
    return origResolveFilename.call(this, request, parent, isMain, options);
  } catch (err: any) {
    if (err && (err.code === 'MODULE_NOT_FOUND' || (err.message && err.message.includes('Cannot find module'))) && !request.startsWith('.') && !request.startsWith('/') && !request.includes(':')) {
      for (const baseDir of candidateNodeModules) {
        try {
          const fallbackPath = path.join(baseDir, request);
          return origResolveFilename.call(this, fallbackPath, parent, isMain, options);
        } catch (_) {}
      }
    }
    throw err;
  }
};

for (const dir of candidateNodeModules) {
  if (!(Module as any).globalPaths.includes(dir)) {
    (Module as any).globalPaths.push(dir);
  }
}

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import * as dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { nativePool } from './conexion_pg';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || path.join(__dirname, '.env'), override: true });

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
let pluginRegistry: any = null;
const candidatePluginPaths = [
  '../plugins/index',
  '../../plugins/index',
  path.resolve(__dirname, '../plugins/index'),
  path.resolve(__dirname, '../../plugins/index'),
  path.resolve(process.cwd(), 'plugins/index'),
  path.resolve(process.cwd(), 'dist_backend/plugins/index'),
  path.resolve(__dirname, '../dist_backend/plugins/index'),
  path.resolve(__dirname, '../../dist_backend/plugins/index'),
];

for (const p of candidatePluginPaths) {
  try {
    const loaded = interop(require(p));
    if (loaded && typeof loaded.mountAll === 'function') {
      pluginRegistry = loaded;
      console.log(`🔌 [Plugin Registry] Cargado exitosamente desde: ${p}`);
      break;
    }
  } catch (err: any) {
    if (!err.message?.includes('Cannot find module')) {
      console.warn(`⚠️ [Plugin Registry] Advertencia al evaluar ${p}:`, err.message);
    }
  }
}

if (!pluginRegistry) {
  console.warn('⚠️ [Plugin Registry] Plugins opcionales no disponibles o no encontrados en las rutas especificadas.');
}

const setupDb = interop(require('./setup_db'));

// --- 2. INICIALIZAR LA APP Y SOCKET.IO ---
export const app = express();
export const httpServer = http.createServer(app);

const PORT: number = process.env.PORT !== undefined ? Number(process.env.PORT) : 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Función helper de validación de origen CORS para desarrollo
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return false;
};

import { setSocketIO } from './socket_bus';
import { attachRealtime } from './realtime';

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

const PgSession = connectPgSimple(session);
const sessionStore = new PgSession({
  pool: nativePool,
  tableName: 'session',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15,
});

const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'edutech-hub-session-secret-key-production-techroom29',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false,          // false incluso en producción Electron (HTTP local)
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días
  }
});

app.use(sessionMiddleware);
attachRealtime(io, sessionMiddleware);

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

// --- 4.1. FUNCIÓN DE ARRANQUE ORDENADA Y SEGURA ---
async function startServer() {
  try {
    // 1. Inicializar esquema de Base de Datos principal
    await setupDb();

    // 2. Montar Plugins del Sistema ANTES de cualquier ruta catch-all
    if (pluginRegistry && typeof pluginRegistry.mountAll === 'function') {
      await pluginRegistry.mountAll(app);
      console.log('✅ [Plugin Registry] Todos los plugins habilitados han sido montados.');
    }

    // 3. Manejador 404 Exclusivo para la API — NUNCA devolver HTML en endpoints bajo /api
    app.all('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: `Endpoint API no encontrado: ${req.method} ${req.originalUrl}`,
      });
    });

    // 4. Manejador de errores interno para la API — garantiza siempre JSON
    app.use((err: any, req: Request, res: Response, next: any) => {
      if (req.path.startsWith('/api')) {
        console.error(`❌ [API Error] ${req.method} ${req.originalUrl}:`, err);
        return res.status(err.status || 500).json({
          success: false,
          error: err.message || 'Error interno del servidor en la API',
        });
      }
      next(err);
    });

    // 5. Ruta base y SPA Fallback (solo para rutas que NO pertenezcan a la API)
    if (IS_PRODUCTION) {
      app.get('*', (req: Request, res: Response) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({
            success: false,
            error: `Endpoint API no encontrado: ${req.method} ${req.originalUrl}`,
          });
        }
        const distPath = path.join(__dirname, '../dist', 'index.html');
        res.sendFile(distPath);
      });
    } else {
      app.get('/', (_req: Request, res: Response) => {
        res.send('Servidor del Backend de EduTecHub funcionando!');
      });
    }

    // 6. Iniciar el servidor HTTP y Socket.IO escuchando en 0.0.0.0 para compatibilidad total con IPv4 / IPv6
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor del Backend (con Socket.IO) corriendo en http://127.0.0.1:${PORT} (0.0.0.0:${PORT})`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();

