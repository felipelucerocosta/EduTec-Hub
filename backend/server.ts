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
const loginRouter = interop(require('./login'));
const alfredRouter = interop(require('./alfred')); 

// Importaciones para las clases
const crearClaseRouter = interop(require('./crear_clase')); 
const unirseClaseRouter = interop(require('./unirse_clase')); 
const obtenerClasesRouter = interop(require('./obtener_clases'));
const obtenerClasesAlumnoRouter = interop(require('./obtener_clases_alumno'));

// Nuevas importaciones de APIs educativas
const trabajosRouter = interop(require('./trabajos'));
const entregasRouter = interop(require('./entregas'));
const materialesApiRouter = interop(require('./materiales_api'));
const notificacionesRouter = interop(require('./notificaciones'));

// 👇 IMPORTAR EL SETUP DE LA BASE DE DATOS (SQLite)
const setupDb = interop(require('./setup_db'));

// --- 2. INICIALIZAR LA APP ---
const app = express();
const PORT: number = Number(process.env.PORT) || 3001;

// --- 3. CONFIGURAR MIDDLEWARE ---
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'una-clave-muy-secreta-y-larga',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días
  }
}));

// --- 4. USAR LAS RUTAS DE LA API ---
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

app.get('/', (_req: Request, res: Response) => {
  res.send('Servidor del Backend de EduTecHub funcionando!');
});

// 👇 INICIALIZAR TABLAS ANTES DE ARRANCAR
setupDb();

// --- 5. INICIAR EL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`✅ Servidor del Backend corriendo en http://localhost:${PORT}`);
});
