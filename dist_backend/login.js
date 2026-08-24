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
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const nodemailer = __importStar(require("nodemailer"));
const router = (0, express_1.Router)();
// Configurar transporter (usar variables de entorno)
const mailTransporter = (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        // ===================================
        // 1. AÑADE ESTAS 3 LÍNEAS AQUÍ
        // ===================================
        tls: {
            rejectUnauthorized: false
        }
    })
    : null;
const attempts = new Map();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // ventana de 15 minutos
const ATTEMPT_THRESHOLD = 3;
// Función para notificar por email (falla suave si no está configurado)
async function notifyFailedAttempts(email) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const subject = 'Alerta: intentos fallidos de inicio de sesión';
    const text = `Hemos detectado múltiples intentos fallidos de inicio de sesión en tu cuenta (${email}). Si no fuiste tú, considera cambiar tu contraseña: ${frontendUrl}`;
    const html = `<p>Hemos detectado múltiples intentos fallidos de inicio de sesión en tu cuenta (${email}).</p>
                <p>Si no fuiste tú, considera <a href="${frontendUrl}/forgot-password">restablecer tu contraseña</a> o ponerte en contacto con soporte.</p>`;
    if (mailTransporter) {
        try {
            await mailTransporter.sendMail({
                from: process.env.SMTP_FROM || `EduTec-Hub <${process.env.SMTP_USER}>`, // Usar un "from" más amigable
                to: email,
                subject,
                text,
                html
            });
            console.log(`Notificación enviada a ${email} por intentos fallidos.`);
        }
        catch (err) {
            console.error('Error enviando notificación de intentos fallidos:', err);
        }
    }
    else {
        console.log('Mail transporter no configurado. Notificación (simulada):', { email, subject, text });
    }
}
// Función para notificar login exitoso por email
async function notifySuccessfulLogin(email) {
    const subject = 'Notificación: Inicio de sesión exitoso';
    const text = `Se ha iniciado sesión exitosamente en tu cuenta (${email}) en EduTecHub. Si no fuiste tú, cambia tu contraseña inmediatamente.`;
    const html = `<p>Se ha iniciado sesión exitosamente en tu cuenta (${email}) en EduTecHub.</p>
                <p>Si no fuiste tú, <strong>cambia tu contraseña inmediatamente</strong> o contacta con soporte.</p>`;
    if (mailTransporter) {
        try {
            await mailTransporter.sendMail({
                from: process.env.SMTP_FROM || `EduTec-Hub <${process.env.SMTP_USER}>`, // Usar un "from" más amigable
                to: email,
                subject,
                text,
                html
            });
            console.log(`Notificación de login exitoso enviada a ${email}.`);
        }
        catch (err) {
            console.error('Error enviando notificación de login exitoso:', err);
        }
    }
    else {
        console.log('Mail transporter no configurado. Notificación de login exitoso (simulada):', { email, subject, text });
    }
}
// --- RUTA DE LOGIN ---
router.post('/login', async (req, res) => {
    // Normalize email to lowercase to match how it's stored during registration
    const correo = req.body.correo ? String(req.body.correo).trim().toLowerCase() : '';
    const contrasena = req.body.contrasena ? String(req.body.contrasena).trim() : '';
    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan correo o contraseña.' });
    }
    try {
        // Use LOWER() for case-insensitive match as extra safety
        const userQuery = 'SELECT * FROM usuarios WHERE LOWER(correo) = $1';
        const result = await conexion_pg_1.default.query(userQuery, [correo]);
        if (!result || !Array.isArray(result.rows) || result.rows.length === 0) {
            handleFailedAttempt(correo);
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
        }
        const usuario = result.rows[0];
        const storedHash = usuario.contrasena ? String(usuario.contrasena).trim() : '';
        const passwordMatch = await bcrypt.compare(contrasena, storedHash);
        if (!passwordMatch) {
            await handleFailedAttempt(correo);
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
        }
        // Login correcto → limpiar contador
        attempts.delete(correo);
        // Determine role:
        // 1. Trust the rol column stored in usuarios (set during registration)
        // 2. If rol is 'alumno' but user exists in profesor table, upgrade to 'profesor'
        // 3. Never downgrade admin
        let rol = usuario.rol || 'alumno';
        if (rol !== 'admin') {
            try {
                const profesorQuery = 'SELECT id_profesor FROM profesor WHERE id_usuario = $1 LIMIT 1';
                const profesorResult = await conexion_pg_1.default.query(profesorQuery, [usuario.id_usuario]);
                if (profesorResult && Array.isArray(profesorResult.rows) && profesorResult.rows.length > 0) {
                    rol = 'profesor';
                }
            }
            catch (e) {
                // If profesor table query fails, fall back to stored rol
                console.warn('Could not check profesor table:', e);
            }
        }
        req.session.usuario = {
            id: Number(usuario.id_usuario),
            nombre: usuario.nombre_completo || '',
            correo: usuario.correo || correo,
            rol
        };
        // Fire-and-forget email notification (don't block login if it fails)
        notifySuccessfulLogin(correo).catch(() => { });
        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            usuario: {
                id: Number(usuario.id_usuario),
                nombre: usuario.nombre_completo || '',
                correo: usuario.correo || correo,
                rol
            }
        });
    }
    catch (err) {
        console.error('Error en la consulta de login:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
// --- RUTA DE ADMIN LOGIN ---
router.post('/admin-login', async (req, res) => {
    const correo = req.body.correo ? String(req.body.correo).trim() : '';
    const contrasena = req.body.contrasena ? String(req.body.contrasena).trim() : '';
    const allowedAdminEmails = ['felipelucero534@gmail.com'];
    if (process.env.ADMIN_EMAIL) {
        allowedAdminEmails.push(process.env.ADMIN_EMAIL.trim().toLowerCase());
    }
    const adminPassword = process.env.ADMIN_PASSWORD || 'Donpatricio111';
    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan correo o contraseña.' });
    }
    const correoLower = correo.toLowerCase();
    if (!allowedAdminEmails.includes(correoLower) || contrasena !== adminPassword) {
        await handleFailedAttempt(correo);
        return res.status(401).json({ success: false, message: 'Credenciales de admin incorrectas.' });
    }
    try {
        const userQuery = 'SELECT * FROM usuarios WHERE LOWER(correo) = $1';
        const result = await conexion_pg_1.default.query(userQuery, [correoLower]);
        let usuario = result.rows && result.rows[0];
        if (!usuario) {
            const hashed = await bcrypt.hash(adminPassword, 10);
            const insertResult = await conexion_pg_1.default.query(`INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, DNI)
         VALUES ($1, $2, $3, 'admin', $4) RETURNING id_usuario, nombre_completo, correo`, ['Administrador', correoLower, hashed, `DNI-${Math.floor(Math.random() * 10000000)}`]);
            usuario = insertResult.rows[0];
        }
        attempts.delete(correo);
        req.session.usuario = {
            id: Number(usuario.id_usuario),
            nombre: usuario.nombre_completo || 'Administrador',
            correo: usuario.correo,
            rol: 'admin',
            isAdmin: true
        };
        await notifySuccessfulLogin(correo);
        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión de admin exitoso.',
            usuario: {
                id: Number(usuario.id_usuario),
                nombre: usuario.nombre_completo || 'Administrador',
                correo: usuario.correo,
                rol: 'admin',
                isAdmin: true
            }
        });
    }
    catch (err) {
        console.error('Error en admin-login:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
// Manejo de intento fallido: incrementa contador, notifica al llegar al umbral
async function handleFailedAttempt(correo) {
    const now = Date.now();
    const rec = attempts.get(correo);
    if (!rec) {
        attempts.set(correo, { count: 1, lastAttempt: now });
        return;
    }
    // si la última vez fue fuera de la ventana, reiniciar contador
    if (now - rec.lastAttempt > ATTEMPT_WINDOW_MS) {
        attempts.set(correo, { count: 1, lastAttempt: now });
        return;
    }
    const newCount = rec.count + 1;
    attempts.set(correo, { count: newCount, lastAttempt: now });
    if (newCount >= ATTEMPT_THRESHOLD) {
        // enviar notificación una sola vez al alcanzar el threshold
        // en vez de spamear, reseteamos el contador después de la notificación
        await notifyFailedAttempts(correo);
        attempts.delete(correo);
    }
}
// --- OLVIDÉ MI CONTRASEÑA ---
// POST /forgot-password -> genera token, guarda en tabla password_resets y envía email con link
router.post('/forgot-password', async (req, res) => {
    const correo = req.body.correo ? String(req.body.correo).trim() : '';
    if (!correo)
        return res.status(400).json({ success: false, message: 'Correo requerido.' });
    try {
        const userQ = 'SELECT id_usuario, correo FROM usuarios WHERE correo = $1';
        const userResult = await conexion_pg_1.default.query(userQ, [correo]);
        // Responder siempre OK para evitar enumeración de usuarios
        if (!userResult || !Array.isArray(userResult.rows) || userResult.rows.length === 0) {
            console.log(`Forgot-password solicitado para correo no registrado: ${correo}`);
            // 3. CORRECCIÓN: Tu frontend espera 'message', no 'message'
            return res.status(200).json({ success: true, message: 'Si existe una cuenta con ese correo, se ha enviado un enlace de recuperación.' });
        }
        const user = userResult.rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
        // Eliminar tokens antiguos del usuario
        await conexion_pg_1.default.query('DELETE FROM password_resets WHERE id_usuario = $1', [user.id_usuario]);
        // Insertar nuevo token
        await conexion_pg_1.default.query('INSERT INTO password_resets(token, id_usuario, expires_at) VALUES($1, $2, $3)', [token, user.id_usuario, expiresAt]);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;
        if (mailTransporter) {
            await mailTransporter.sendMail({
                from: process.env.SMTP_FROM || `EduTec-Hub <${process.env.SMTP_USER}>`, // Usar un "from" más amigable
                to: user.correo,
                subject: 'Recuperar contraseña - EduTecHub',
                text: `Para restablecer tu contraseña, visita: ${resetLink}`,
                html: `<p>Para restablecer tu contraseña, haz clic <a href="${resetLink}">aquí</a> (válido 1 hora).</p>`
            });
            console.log(`Enviado email de recuperación a ${user.correo}`);
        }
        else {
            // Fallback: log
            console.log('Mail transporter no configurado. Link de reseteo (usar en desarrollo):', resetLink);
        }
        return res.status(200).json({ success: true, message: 'Si existe una cuenta con ese correo, se ha enviado un enlace de recuperación.' });
    }
    catch (err) {
        console.error('Error en forgot-password:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
// GET /reset-password/validate?token= -> validar token
router.get('/reset-password/validate', async (req, res) => {
    const token = String(req.query.token || '');
    if (!token)
        return res.status(400).json({ valid: false, message: 'Token requerido.' });
    try {
        const q = 'SELECT id_usuario, expires_at FROM password_resets WHERE token = $1';
        const r = await conexion_pg_1.default.query(q, [token]);
        if (!r || !Array.isArray(r.rows) || r.rows.length === 0) {
            return res.status(404).json({ valid: false, message: 'Token no encontrado o inválido.' });
        }
        const row = r.rows[0];
        if (new Date(row.expires_at) < new Date()) {
            return res.status(410).json({ valid: false, message: 'Token expirado.' });
        }
        return res.status(200).json({ valid: true });
    }
    catch (err) {
        console.error('Error validando token:', err);
        return res.status(500).json({ valid: false, message: 'Error interno.' });
    }
});
// POST /reset-password -> recibe token + nueva contraseña, actualiza usuario y borra token
router.post('/reset-password', async (req, res) => {
    const token = req.body.token ? String(req.body.token) : '';
    const nueva = req.body.contrasena ? String(req.body.contrasena) : '';
    if (!token || !nueva)
        return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos.' });
    if (nueva.length < 6)
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
    try {
        const q = 'SELECT id_usuario, expires_at FROM password_resets WHERE token = $1';
        const r = await conexion_pg_1.default.query(q, [token]);
        if (!r || !Array.isArray(r.rows) || r.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Token inválido.' });
        }
        const row = r.rows[0];
        if (new Date(row.expires_at) < new Date()) {
            // borrar token expirado
            await conexion_pg_1.default.query('DELETE FROM password_resets WHERE token = $1', [token]);
            return res.status(410).json({ success: false, message: 'Token expirado.' });
        }
        const hashed = await bcrypt.hash(nueva, 10);
        await conexion_pg_1.default.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hashed, row.id_usuario]);
        // eliminar token usado
        await conexion_pg_1.default.query('DELETE FROM password_resets WHERE token = $1', [token]);
        return res.status(200).json({ success: true, message: 'Contraseña restablecida correctamente.' });
    }
    catch (err) {
        console.error('Error en reset-password:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
// GET /whoami -> devuelve los datos del usuario en sesión
router.get('/whoami', (req, res) => {
    if (req.session && req.session.usuario) {
        return res.status(200).json({ user: req.session.usuario });
    }
    return res.status(200).json({ user: null });
});
exports.default = router;
