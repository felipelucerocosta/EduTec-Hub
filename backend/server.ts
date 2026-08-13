import express, { type Request, type Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

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

const trabajosRouter      = interop(require('./trabajos'));
const entregasRouter      = interop(require('./entregas'));
const materialesApiRouter = interop(require('./materiales_api'));
const notificacionesRouter = interop(require('./notificaciones'));

const setupDb = interop(require('./setup_db'));

// --- 2. INICIALIZAR LA APP ---
const app = express();
const PORT: number = Number(process.env.PORT) || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// --- 3. CONFIGURAR MIDDLEWARE ---
// En producción el frontend se sirve desde este mismo servidor (sin CORS cross-origin)
if (!IS_PRODUCTION) {
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos subidos por usuarios
const uploadsPath = IS_PRODUCTION
  ? path.join(process.cwd(), 'uploads')
  : path.join(__dirname, '../uploads');
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
app.use('/api', trabajosRouter);
app.use('/api', entregasRouter);
app.use('/api', materialesApiRouter);
app.use('/api', notificacionesRouter);

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

app.listen(PORT, () => {
  console.log(`✅ Servidor del Backend corriendo en http://localhost:${PORT}`);
});
