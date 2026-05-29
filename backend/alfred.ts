import { Router, Request, Response } from 'express';
import axios, { AxiosRequestConfig } from 'axios';
import pool from './conexion_pg'; // 👈 IMPORTAMOS LA CONEXIÓN A POSTGRESQL
import * as bcrypt from 'bcrypt'; // 👈 IMPORTAMOS BCRYPT
import * as nodemailer from 'nodemailer'; // <- cambiado desde "import nodemailer from 'nodemailer'"

// Definición de tipos para la estructura de la conversación
interface ChatContent {
    role: 'user' | 'model'; // 'user' para el usuario, 'model' para la IA
    parts: Array<{ text: string }>;
}

// Interfaz para el cuerpo de la solicitud (req.body) de /ask-alfred
interface AskAlfredBody {
    chatHistory: ChatContent[];
}

// Interfaz para el cuerpo de la solicitud (req.body) de /generate-password
interface GeneratePasswordBody {
    email: string;
    context?: string;
}

const router: Router = Router();

import 'express-session';

// Middleware: permitir acceso a usuarios autenticados (admin, profesor, alumno)
function requireAuth(req: Request, res: Response, next: any) {
    const rol = (req.session as any)?.usuario?.rol;
    if (!rol) return res.status(401).json({ error: 'Unauthorized', message: 'Inicia sesión para usar Alfred.' });
    const allowed = ['admin', 'profesor', 'alumno'];
    if (allowed.includes(String(rol))) return next();
    return res.status(403).json({ error: 'Forbidden', message: 'No tienes permisos para usar Alfred.' });
}

// Helper: detectar email institucional
function isInstitutionalEmail(email: string): boolean {
    const env = process.env.INSTITUTIONAL_DOMAINS; // opcional: "uni.edu,school.edu"
    if (env) {
        const domains = env.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
        return domains.some(d => email.toLowerCase().endsWith(`@${d}`));
    }
    return /@.+\.(edu(\.[a-z]{2})?|ac\.[a-z]{2})$/i.test(email);
}

// Helper: enviar email de verificación
async function sendVerificationEmail(to: string, code: string) {
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

        // Intentar verificar, pero no bloquear el envío si el fallo es por certificado autofirmado
        try {
            await transporter.verify();
        } catch (verifyErr: any) {
            console.warn('SMTP verify warning (no fatal):', verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
            // Si el error NO es del tipo de certificado autofirmado, relanzar
            if (!(verifyErr && (verifyErr.code === 'ESOCKET' || (verifyErr.message || '').toLowerCase().includes('self-signed')))) {
                throw verifyErr;
            }
            // En caso de self-signed seguimos adelante (en desarrollo). Si quieres forzar ignore, set SMTP_REJECT_UNAUTHORIZED=false
        }

        const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@example.com';

        await transporter.sendMail({
            from,
            to,
            subject: 'Código de verificación',
            text: `Tu código de verificación es: ${code}. Caduca en 10 minutos.`,
            html: `<p>Tu código de verificación es: <strong>${code}</strong></p><p>Caduca en 10 minutos.</p>`
        });
    } catch (err) {
        console.error('sendVerificationEmail error details:', err && (err as any).response || (err as any).message || err);
        throw err;
    }
}

// ===================================
// RUTA 1: /ask-alfred (CHAT NORMAL)
// (Sin cambios salvo usar env para la KEY)
// ===================================
router.post('/ask-alfred', requireAuth, async (req: Request<{}, {}, AskAlfredBody>, res: Response) => {
    const { chatHistory } = req.body;

    if (!chatHistory) {
        return res.status(400).json({ error: 'El historial del chat es requerido.' });
    }

    const apiKey: string = process.env.GEMINI_API_KEY || "AIzaSyCvttzZon067xS7DnQsgQIgNXvaMFTEpBw";

    if (apiKey === "" || !apiKey) {
        console.error("API Key de Gemini no está configurada.");
        return res.status(500).json({ error: 'Servicio de IA no configurado.' });
    }
    
    const apiUrl: string = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const payload: { contents: ChatContent[] } = { contents: chatHistory };

        try {
            const apiResponse = await callGeminiWithRetry(apiKey, payload);
            if (apiResponse.data.candidates && apiResponse.data.candidates.length > 0) {
                res.status(200).json({ candidates: apiResponse.data.candidates });
            } else {
                res.status(500).json({ error: 'Respuesta no válida de la IA.' });
            }
        } catch (error: any) {
            console.error('Error llamando a la API de Gemini (ask-alfred):', error && (error.response?.data || error.message || error));
            res.status(500).json({ error: 'Error interno al contactar la IA.' });
        }
});


// ==========================================================
// RUTA 2: /generate-password (actualizada: devuelve reply para el chat)
// ==========================================================
router.post('/generate-password', async (req: Request<{}, {}, GeneratePasswordBody>, res: Response) => {
    const { email, context } = req.body;
    const apiKey: string = process.env.GEMINI_API_KEY || "";

    if (!email) {
        return res.status(400).json({ error: 'El correo es requerido.', reply: 'Debes indicar un correo.' });
    }

    try {
        // Verificar usuario existe
        const userQuery = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Correo no encontrado.', reply: 'No encontramos ese correo en el sistema.' });
        }
        const userId = userQuery.rows[0].id_usuario;

        if (isInstitutionalEmail(email)) {
            // generar código, guardar y enviar (no generar contraseña todavía)
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await pool.query(
                `INSERT INTO email_verifications (user_id, code, expires_at, used)
                 VALUES ($1, $2, NOW() + INTERVAL '10 minutes', false)`,
                [userId, code]
            );
            try {
                await sendVerificationEmail(email, code);
                return res.status(200).json({
                    verificationRequired: true,
                    reply: 'Te envié un código al correo institucional. Pásame el código aquí para verificar que el correo es tuyo.'
                });
            } catch (mailErr) {
                console.error('Error enviando email de verificación:', mailErr);
                // devolver respuesta amigable para el chat
                return res.status(500).json({
                    error: 'No se pudo enviar el email de verificación.',
                    reply: 'No pude enviar el código al correo. Revisa la configuración de correo o intenta nuevamente.'
                });
            }
        } else {
            // no institucional: generar contraseña inmediatamente
            const prompt = context || `Generar una contraseña segura de 12 caracteres para ${email}`;
            const chatHistory: ChatContent[] = [
                { role: "user", parts: [{ text: "Eres un generador de contraseñas seguras. Responde solo con la contraseña generada, sin texto adicional." }] },
                { role: "model", parts: [{ text: "Entendido." }] },
                { role: "user", parts: [{ text: prompt }] }
            ];
            const payload = { contents: chatHistory };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            const config: AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' } };
            
            const apiResponse = await callGeminiWithRetry(apiKey, payload);
            if (!apiResponse.data?.candidates || apiResponse.data.candidates.length === 0) {
                console.error('La API de IA no generó una contraseña:', apiResponse.data);
                return res.status(500).json({ error: 'No se pudo generar la contraseña.', reply: 'No pude generar la contraseña. Intenta nuevamente más tarde.' });
            }
            const newPassword = apiResponse.data.candidates[0].content.parts[0].text.trim();
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hashedPassword, userId]);

            return res.status(200).json({
                verificationRequired: false,
                password: newPassword,
                reply: 'Contraseña generada y actualizada correctamente.'
            });
        }
    } catch (error: any) {
        console.error('Error en /generate-password:', error.message || error);
        return res.status(500).json({ error: 'Error interno.', reply: 'Ocurrió un error interno. Intenta nuevamente.' });
    }
});

// ==========================================================
// RUTA 3: /verify-email-code (actualizada: reply claro y marca usado sólo después de guardar)
// ==========================================================
router.post('/verify-email-code', async (req: Request<{}, {}, { email: string; code: string; context?: string }>, res: Response) => {
    const { email, code, context } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: 'Email y código son requeridos.', reply: 'Debes enviar el correo y el código que recibiste.' });
    }

    try {
        const userQuery = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Correo no encontrado.', reply: 'No encontramos ese correo en el sistema.' });
        }
        const userId = userQuery.rows[0].id_usuario;

        const vq = await pool.query(
            `SELECT id, expires_at, used FROM email_verifications
             WHERE user_id = $1 AND code = $2
             ORDER BY id DESC LIMIT 1`,
            [userId, code]
        );

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

        // generar contraseña con Gemini
        const apiKey: string = process.env.GEMINI_API_KEY || "";
        if (!apiKey) {
            console.error('GEMINI_API_KEY no configurada.');
            return res.status(500).json({ error: 'Falta configuración de la API.', reply: 'No puedo generar la contraseña ahora; falta configurar el servicio de generación.' });
        }

        const prompt = context || `Generar una contraseña segura de 12 caracteres para ${email}`;
        const chatHistory: ChatContent[] = [
            { role: "user", parts: [{ text: "Eres un generador de contraseñas seguras. Responde solo con la contraseña generada, sin texto adicional." }] },
            { role: "model", parts: [{ text: "Entendido." }] },
            { role: "user", parts: [{ text: prompt }] }
        ];
        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const config: AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' } };

        try {
            const apiResponse = await callGeminiWithRetry(apiKey, payload);
            console.log('Gemini response data:', apiResponse.data);

            if (!apiResponse.data?.candidates || apiResponse.data.candidates.length === 0) {
                console.error('Respuesta inválida de Gemini:', apiResponse.data);
                return res.status(500).json({ error: 'No se pudo generar la contraseña.', reply: 'No pude generar la contraseña. Intenta nuevamente.' });
            }

            const newPassword = apiResponse.data.candidates[0].content.parts[0].text.trim();
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // actualizar contraseña en usuarios
            await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hashedPassword, userId]);

            // marcar el código como usado
            await pool.query('UPDATE email_verifications SET used = true WHERE id = $1', [row.id]);

            return res.status(200).json({
                success: true,
                password: newPassword,
                reply: 'Código verificado. Contraseña generada y actualizada correctamente.'
            });
        } catch (apiErr: any) {
            console.error('Error llamando a Gemini:', apiErr && (apiErr.response?.data || apiErr.message || apiErr));
            return res.status(500).json({ error: 'No se pudo generar la contraseña.', reply: 'Ocurrió un error generando la contraseña. Intenta nuevamente.' });
        }
    } catch (err: any) {
        console.error('Error en /verify-email-code:', err);
        return res.status(500).json({ error: 'Error interno al verificar el código.', reply: 'Error interno. Intenta nuevamente.' });
    }
});

export default router;

// =======================
// Helper: llamar a Gemini con reintentos exponenciales y manejo de 429
// =======================
async function callGeminiWithRetry(apiKey: string, payload: any, maxAttempts = 3) {
    const urlBase = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';
    const apiUrl = `${urlBase}?key=${apiKey}`;
    const headers = { 'Content-Type': 'application/json' };

    let attempt = 0;
    let lastErr: any = null;

    while (attempt < maxAttempts) {
        attempt++;
        try {
            const resp = await axios.post(apiUrl, payload, { headers });
            return resp;
        } catch (err: any) {
            lastErr = err;
            const status = err?.response?.status;
            // If 429, attempt to respect Retry-After header
            if (status === 429) {
                const retryAfter = err.response?.headers?.['retry-after'];
                let waitMs = 1000 * Math.pow(2, attempt - 1); // exponential: 1s,2s,4s
                if (retryAfter) {
                    const ra = Number(retryAfter);
                    if (!Number.isNaN(ra)) waitMs = ra * 1000;
                }
                console.warn(`Gemini 429 received, attempt ${attempt} of ${maxAttempts}. Waiting ${waitMs}ms before retry.`);
                await delay(waitMs);
                continue;
            }

            // For 5xx, retry too
            if (status >= 500 && status < 600) {
                const waitMs = 1000 * Math.pow(2, attempt - 1);
                console.warn(`Gemini ${status} received, retrying attempt ${attempt} after ${waitMs}ms`);
                await delay(waitMs);
                continue;
            }

            // Other errors, don't retry
            throw err;
        }
    }
    // if we exit loop, throw last error
    throw lastErr || new Error('Error calling Gemini');
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}