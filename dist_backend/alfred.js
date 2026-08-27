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
const axios_1 = __importDefault(require("axios"));
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const bcrypt = __importStar(require("bcrypt"));
const nodemailer = __importStar(require("nodemailer"));
const router = (0, express_1.Router)();
require("express-session");
// Helper para ocultar la API Key en consola por seguridad (ej: AQ.Ab8...ZG-Q)
function maskKey(key) {
    if (!key)
        return '(sin clave)';
    if (key.length <= 10)
        return '***';
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
}
// Middleware de autenticación (permite paso en desarrollo o si hay sesión activa)
function requireAuth(req, res, next) {
    const usuario = req.session?.usuario;
    if (usuario)
        return next();
    // En desarrollo permitimos peticiones directas para facilitar pruebas
    if (process.env.NODE_ENV !== 'production')
        return next();
    return res.status(401).json({
        error: 'Unauthorized',
        message: 'Inicia sesión para usar Alfred.',
        reply: 'Por favor, inicia sesión para hacer consultas a Alfred.'
    });
}
function isInstitutionalEmail(email) {
    const env = process.env.INSTITUTIONAL_DOMAINS;
    if (env) {
        const domains = env.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
        return domains.some(d => email.toLowerCase().endsWith(`@${d}`));
    }
    return /@.+\.(edu(\.[a-z]{2})?|ac\.[a-z]{2})$/i.test(email);
}
async function sendVerificationEmail(to, code) {
    try {
        const rejectUnauthorized = process.env.SMTP_REJECT_UNAUTHORIZED === 'false' ? false : true;
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized
            }
        });
        try {
            await transporter.verify();
        }
        catch (verifyErr) {
            console.warn('SMTP verify warning (no fatal):', verifyErr?.message || verifyErr);
        }
        const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@example.com';
        await transporter.sendMail({
            from,
            to,
            subject: 'Código de verificación',
            text: `Tu código de verificación es: ${code}. Caduca en 10 minutos.`,
            html: `<p>Tu código de verificación es: <strong>${code}</strong></p><p>Caduca en 10 minutos.</p>`
        });
    }
    catch (err) {
        console.error('sendVerificationEmail error details:', err);
        throw err;
    }
}
// ===================================
// RUTA 1: /ask-alfred (CHAT CON GEMINI)
// Acepta tanto { chatHistory: [...] } como { message: "texto" } o { prompt: "texto" }
// ===================================
router.post('/ask-alfred', requireAuth, async (req, res) => {
    let chatHistory = req.body.chatHistory;
    const rawInput = req.body.message || req.body.prompt;
    // Normalizar entrada libre a chatHistory
    if ((!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) && rawInput) {
        chatHistory = [{ role: 'user', parts: [{ text: String(rawInput).trim() }] }];
    }
    if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
        return res.status(400).json({
            error: 'Entrada inválida',
            reply: 'Debes enviar un mensaje o historial de chat válido.'
        });
    }
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
        console.error("❌ [Alfred Backend] Error: GEMINI_API_KEY no está definida en backend/.env");
        return res.status(500).json({
            error: 'Servicio de IA no configurado.',
            reply: 'Disculpe, la clave de API de Gemini no está configurada en el servidor (GEMINI_API_KEY ausente).'
        });
    }
    console.log(`🤖 [Alfred Backend] Procesando consulta con Gemini API (Key: ${maskKey(apiKey)})`);
    const payload = { contents: chatHistory };
    try {
        const apiResponse = await callGeminiWithRetry(apiKey, payload);
        const candidates = apiResponse.data?.candidates || [];
        if (candidates.length > 0) {
            const replyText = candidates[0]?.content?.parts?.[0]?.text || "Respuesta recibida.";
            console.log(`✅ [Alfred Backend] Gemini respondió exitosamente (${replyText.length} caracteres).`);
            return res.status(200).json({
                candidates,
                response: replyText,
                reply: replyText,
                message: replyText
            });
        }
        else {
            console.error('❌ [Alfred Backend] Gemini respondió pero sin candidatos válidos:', apiResponse.data);
            return res.status(500).json({
                error: 'Respuesta no válida de la IA.',
                reply: 'No se obtuvo un texto válido en la respuesta de Gemini.'
            });
        }
    }
    catch (error) {
        const status = error.response?.status;
        const errDetail = error.response?.data?.error?.message || error.message;
        if (status === 401) {
            console.error(`❌ [Alfred Backend] Error 401 de Gemini API: Autenticación no autorizada (Key: ${maskKey(apiKey)}). Detalle: ${errDetail}`);
            return res.status(401).json({
                error: 'API Key de Gemini no autorizada',
                reply: 'Error 401 de Gemini. Verifica la configuración de la clave GEMINI_API_KEY en backend/.env.'
            });
        }
        if (status === 404) {
            console.error(`❌ [Alfred Backend] Error 404 de Gemini API: Modelo no disponible. Detalle: ${errDetail}`);
            return res.status(404).json({
                error: 'Modelo de Gemini no disponible',
                reply: 'El modelo configurado para Gemini no está disponible actualmente.'
            });
        }
        if (status === 429) {
            console.error(`⚠️ [Alfred Backend] Error 429 de Gemini API: Límite de cuota alcanzado.`);
            return res.status(429).json({
                error: 'Límite de solicitudes alcanzado',
                reply: 'Se ha alcanzado el límite de solicitudes de la API de Gemini. Intente nuevamente en unos minutos.'
            });
        }
        console.error(`❌ [Alfred Backend] Error al llamar a la API de Gemini (Status ${status || 'red'}):`, errDetail);
        return res.status(500).json({
            error: 'Error de comunicación con la IA',
            reply: 'Lo siento, ocurrió un error al comunicar con el servicio de IA. Intente nuevamente en unos instantes.'
        });
    }
});
// ==========================================================
// RUTA 2: /generate-password
// ==========================================================
router.post('/generate-password', async (req, res) => {
    const { email, context } = req.body;
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!email) {
        return res.status(400).json({ error: 'El correo es requerido.', reply: 'Debes indicar un correo.' });
    }
    try {
        const userQuery = await conexion_pg_1.default.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Correo no encontrado.', reply: 'No encontramos ese correo en el sistema.' });
        }
        const userId = userQuery.rows[0].id_usuario;
        if (isInstitutionalEmail(email)) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            await conexion_pg_1.default.query(`INSERT INTO email_verifications (user_id, code, expires_at, used)
                 VALUES ($1, $2, $3, false)`, [userId, code, expiresAt]);
            try {
                await sendVerificationEmail(email, code);
                return res.status(200).json({
                    verificationRequired: true,
                    reply: 'Te envié un código al correo institucional. Pásame el código aquí para verificar que el correo es tuyo.'
                });
            }
            catch (mailErr) {
                console.error('Error enviando email de verificación:', mailErr);
                return res.status(500).json({
                    error: 'No se pudo enviar el email de verificación.',
                    reply: 'No pude enviar el código al correo. Revisa la configuración de correo o intenta nuevamente.'
                });
            }
        }
        else {
            const prompt = context || `Generar una contraseña segura de 12 caracteres para ${email}`;
            const chatHistory = [
                { role: "user", parts: [{ text: "Eres un generador de contraseñas seguras. Responde solo con la contraseña generada, sin texto adicional." }] },
                { role: "model", parts: [{ text: "Entendido." }] },
                { role: "user", parts: [{ text: prompt }] }
            ];
            const apiResponse = await callGeminiWithRetry(apiKey, { contents: chatHistory });
            if (!apiResponse.data?.candidates || apiResponse.data.candidates.length === 0) {
                return res.status(500).json({ error: 'No se pudo generar la contraseña.', reply: 'No pude generar la contraseña. Intenta nuevamente más tarde.' });
            }
            const newPassword = apiResponse.data.candidates[0].content.parts[0].text.trim();
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await conexion_pg_1.default.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hashedPassword, userId]);
            return res.status(200).json({
                verificationRequired: false,
                password: newPassword,
                reply: 'Contraseña generada y actualizada correctamente.'
            });
        }
    }
    catch (error) {
        console.error('Error en /generate-password:', error.message || error);
        return res.status(500).json({ error: 'Error interno.', reply: 'Ocurrió un error interno al procesar la contraseña.' });
    }
});
// ==========================================================
// RUTA 3: /verify-email-code
// ==========================================================
router.post('/verify-email-code', async (req, res) => {
    const { email, code, context } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: 'Email y código son requeridos.', reply: 'Debes enviar el correo y el código que recibiste.' });
    }
    try {
        const userQuery = await conexion_pg_1.default.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Correo no encontrado.', reply: 'No encontramos ese correo en el sistema.' });
        }
        const userId = userQuery.rows[0].id_usuario;
        const vq = await conexion_pg_1.default.query(`SELECT id, expires_at, used FROM email_verifications
             WHERE user_id = $1 AND code = $2
             ORDER BY id DESC LIMIT 1`, [userId, code]);
        if (vq.rows.length === 0) {
            return res.status(400).json({ error: 'Código inválido.', reply: 'Código inválido. Verifica el número que te llegó al correo.' });
        }
        const row = vq.rows[0];
        if (row.used) {
            return res.status(400).json({ error: 'Código ya utilizado.', reply: 'Ese código ya fue usado. Solicita uno nuevo si es necesario.' });
        }
        const expiresAt = new Date(row.expires_at);
        if (expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ error: 'Código expirado.', reply: 'El código expiró. Solicita uno nuevo.' });
        }
        const apiKey = (process.env.GEMINI_API_KEY || "").trim();
        if (!apiKey) {
            return res.status(500).json({ error: 'Falta configuración de la API.', reply: 'No puedo generar la contraseña ahora; falta configurar el servicio de generación.' });
        }
        const prompt = context || `Generar una contraseña segura de 12 caracteres para ${email}`;
        const chatHistory = [
            { role: "user", parts: [{ text: "Eres un generador de contraseñas seguras. Responde solo con la contraseña generada, sin texto adicional." }] },
            { role: "model", parts: [{ text: "Entendido." }] },
            { role: "user", parts: [{ text: prompt }] }
        ];
        try {
            const apiResponse = await callGeminiWithRetry(apiKey, { contents: chatHistory });
            if (!apiResponse.data?.candidates || apiResponse.data.candidates.length === 0) {
                return res.status(500).json({ error: 'No se pudo generar la contraseña.', reply: 'No pude generar la contraseña. Intenta nuevamente.' });
            }
            const newPassword = apiResponse.data.candidates[0].content.parts[0].text.trim();
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await conexion_pg_1.default.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hashedPassword, userId]);
            await conexion_pg_1.default.query('UPDATE email_verifications SET used = true WHERE id = $1', [row.id]);
            return res.status(200).json({
                success: true,
                password: newPassword,
                reply: 'Código verificado. Contraseña generada y actualizada correctamente.'
            });
        }
        catch (apiErr) {
            console.error('Error llamando a Gemini en verify-email-code:', apiErr?.message || apiErr);
            return res.status(500).json({ error: 'No se pudo generar la contraseña.', reply: 'Ocurrió un error generando la contraseña.' });
        }
    }
    catch (err) {
        console.error('Error en /verify-email-code:', err);
        return res.status(500).json({ error: 'Error interno al verificar el código.', reply: 'Error interno. Intenta nuevamente.' });
    }
});
exports.default = router;
// Helper: llamar a Gemini con modelo gemini-3.6-flash y reintentos / fallbacks
async function callGeminiWithRetry(apiKey, payload, maxAttempts = 3) {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const candidateModels = Array.from(new Set([primaryModel, 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash-latest']));
    let lastErr = null;
    for (const model of candidateModels) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const headers = {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        };
        let attempt = 0;
        while (attempt < maxAttempts) {
            attempt++;
            try {
                const resp = await axios_1.default.post(apiUrl, payload, { headers, timeout: 15000 });
                return resp;
            }
            catch (err) {
                lastErr = err;
                const status = err?.response?.status;
                if (status === 401) {
                    throw err;
                }
                if (status === 404) {
                    console.warn(`[Alfred Backend] Modelo '${model}' devolvió 404, probando modelo de respaldo...`);
                    break;
                }
                if (status === 429) {
                    const retryAfter = err.response?.headers?.['retry-after'];
                    let waitMs = 1000 * Math.pow(2, attempt - 1);
                    if (retryAfter) {
                        const ra = Number(retryAfter);
                        if (!Number.isNaN(ra))
                            waitMs = ra * 1000;
                    }
                    console.warn(`[Alfred Backend] Gemini 429 alcanzado, intento ${attempt} de ${maxAttempts}. Esperando ${waitMs}ms.`);
                    await delay(waitMs);
                    continue;
                }
                if (status >= 500 && status < 600) {
                    const waitMs = 1000 * Math.pow(2, attempt - 1);
                    console.warn(`[Alfred Backend] Gemini ${status}, reintentando ${attempt} en ${waitMs}ms`);
                    await delay(waitMs);
                    continue;
                }
                throw err;
            }
        }
    }
    throw lastErr || new Error('Error al conectar con la API de Gemini');
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
