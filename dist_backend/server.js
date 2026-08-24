"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
const dotenv = __importStar(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
dotenv.config();
function interop(m) { return m && (m.default ?? m); }
// --- 1. IMPORTAR LOS ARCHIVOS DE RUTAS ---
const apiRutasRouter = interop(require('./api_rutas'));
const mensajesRouter = interop(require('./mensajes'));
const registroRouter = interop(require('./registro'));
const loginRouter = interop(require('./login'));
const alfredRouter = interop(require('./alfred'));
const crearClaseRouter = interop(require('./crear_clase'));
const unirseClaseRouter = interop(require('./unirse_clase'));
const obtenerClasesRouter = interop(require('./obtener_clases'));
const obtenerClasesAlumnoRouter = interop(require('./obtener_clases_alumno'));
const trabajosRouter = interop(require('./trabajos'));
const entregasRouter = interop(require('./entregas'));
const materialesApiRouter = interop(require('./materiales_api'));
const notificacionesRouter = interop(require('./notificaciones'));
const rendimientoRouter = interop(require('./rendimiento'));
const boletinRouter = interop(require('./boletin'));
const simuladoresApiRouter = interop(require('./simuladores_api'));
const setupDb = interop(require('./setup_db'));
// --- 2. INICIALIZAR LA APP Y SOCKET.IO ---
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const PORT = Number(process.env.PORT) || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    }
});
exports.io.on('connection', (socket) => {
    console.log(`🔌 Cliente Socket.IO conectado: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`❌ Cliente Socket.IO desconectado: ${socket.id}`);
    });
});
// --- 3. CONFIGURAR MIDDLEWARE ---
// En producción el frontend se sirve desde este mismo servidor (sin CORS cross-origin)
if (!IS_PRODUCTION) {
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    }));
}
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Archivos subidos por usuarios
const uploadsPath = IS_PRODUCTION
    ? path_1.default.join(process.cwd(), 'uploads')
    : path_1.default.join(__dirname, '../uploads');
app.use('/uploads', express_1.default.static(uploadsPath));
// Archivos del frontend (solo en producción)
if (IS_PRODUCTION) {
    const distPath = path_1.default.join(__dirname, '../dist');
    app.use(express_1.default.static(distPath));
}
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'una-clave-muy-secreta-y-larga',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // false incluso en producción Electron (HTTP local)
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
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
app.use('/api', rendimientoRouter);
app.use('/api', boletinRouter);
app.use('/api', simuladoresApiRouter);
// Ruta base — en producción sirve el index.html del frontend (SPA fallback)
if (IS_PRODUCTION) {
    app.get('*', (_req, res) => {
        const distPath = path_1.default.join(__dirname, '../dist', 'index.html');
        res.sendFile(distPath);
    });
}
else {
    app.get('/', (_req, res) => {
        res.send('Servidor del Backend de EduTecHub funcionando!');
    });
}
// --- 5. INICIALIZAR TABLAS Y ARRANCAR ---
setupDb();
httpServer.listen(PORT, () => {
    console.log(`✅ Servidor del Backend (con Socket.IO) corriendo en http://localhost:${PORT}`);
});
