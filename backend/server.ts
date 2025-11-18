import type { Request, Response } from 'express';
const express = require('express');
const cors = require('cors');
const session = require('express-session');
import * as dotenv from 'dotenv'; // 👈 1. IMPORTAR DOTENV

// 👈 2. EJECUTAR DOTENV (Esto lee tu archivo .env)
// (Debe estar ANTES de que cualquier otro archivo intente usar process.env)
dotenv.config(); 

function interop(m: any) { return m && (m.default ?? m); }

const apiRutasRouter = interop(require('./api_rutas'));
const mensajesRouter = interop(require('./mensajes'));
const registroRouter = interop(require('./registro'));
const loginRouter = interop(require('./login'));
const alfredRouter = interop(require('./alfred')); 
const obtenerClasesRouter = interop(require('./obtener_clases'));

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

app.use(session({
  secret: process.env.SESSION_SECRET || 'una-clave-muy-secreta-y-larga',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// --- 4. USAR LAS RUTAS DE LA API ---
app.use('/api', mensajesRouter);
app.use('/api', registroRouter);
app.use('/api', loginRouter);
app.use('/api', apiRutasRouter);
app.use('/api', alfredRouter); 
app.use('/api', obtenerClasesRouter);

app.get('/', (_req: Request, res: Response) => {
  res.send('Servidor del Backend de EduTecHub funcionando!');
});

// --- 5. INICIAR EL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`✅ Servidor del Backend corriendo en http://localhost:${PORT}`);
});