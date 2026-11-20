import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { GroqService, type GroqMessage } from './services/groqService';

interface ChatContent {
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
}

interface AskAlfredBody {
    chatHistory?: ChatContent[];
    message?: string;
    prompt?: string;
    stream?: boolean;
    conversacionId?: number;
}

interface GeneratePasswordBody {
    email: string;
    context?: string;
}

const router: Router = Router();

import 'express-session';

// Helper para ocultar la API Key en consola por seguridad (ej: gsk_c8...9sA)
function maskKey(key: string): string {
    if (!key) return '(sin clave)';
    if (key.length <= 10) return '***';
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

// Middleware de autenticación (permite paso en desarrollo o si hay sesión activa)
function requireAuth(req: Request, res: Response, next: any) {
    const usuario = (req.session as any)?.usuario;
    if (usuario && usuario.id) return next();

    // En desarrollo permitimos peticiones si se proporciona usuario simulado o sesión
    if (process.env.NODE_ENV !== 'production' && usuario) return next();

    return res.status(401).json({
        error: 'Unauthorized',
        message: 'Debes iniciar sesión para interactuar con Alfred.',
        reply: 'Por favor, inicia sesión para conversar con Alfred.'
    });
}

function isInstitutionalEmail(email: string): boolean {
    const env = process.env.INSTITUTIONAL_DOMAINS;
    if (env) {
        const domains = env.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
        return domains.some(d => email.toLowerCase().endsWith(`@${d}`));
    }
    return /@.+\.(edu(\.[a-z]{2})?|ac\.[a-z]{2})$/i.test(email);
}

async function sendVerificationEmail(to: string, code: string) {
    try {
        const rejectUnauthorized = process.env.SMTP_REJECT_UNAUTHORIZED === 'false' ? false : true;

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '').trim() : ''
            },
            tls: {
                rejectUnauthorized
            }
        });

        try {
            await transporter.verify();
        } catch (verifyErr: any) {
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
    } catch (err) {
        console.error('sendVerificationEmail error details:', err);
        throw err;
    }
}

// ==============================================================================
// GESTIÓN DE CONVERSACIONES E HISTORIAL EN POSTGRESQL
// ==============================================================================

// GET /api/alfred/conversaciones - Listar conversaciones del usuario autenticado
router.get('/alfred/conversaciones', requireAuth, async (req: Request, res: Response) => {
    const usuario = (req.session as any)?.usuario;
    const userId = usuario.id;

    try {
        const query = `
            SELECT 
                c.id, 
                c.titulo, 
                c.creado_en, 
                c.actualizado_en,
                (
                    SELECT m.contenido 
                    FROM alfred_mensajes m 
                    WHERE m.conversacion_id = c.id 
                    ORDER BY m.id DESC 
                    LIMIT 1
                ) as ultimo_mensaje,
                (
                    SELECT COUNT(*) 
                    FROM alfred_mensajes m 
                    WHERE m.conversacion_id = c.id
                )::int as total_mensajes
            FROM alfred_conversaciones c
            WHERE c.usuario_id = $1
            ORDER BY c.actualizado_en DESC
        `;
        const result = await pool.query(query, [userId]);
        return res.json({
            conversaciones: result.rows || [],
            groqConfigured: GroqService.isConfigured(),
            aiConfigured: GroqService.isConfigured(),
            model: GroqService.getModelDisplayName()
        });
    } catch (error: any) {
        console.error('Error al listar conversaciones de Alfred:', error);
        return res.status(500).json({ error: 'Error al recuperar conversaciones de Alfred' });
    }
});

// POST /api/alfred/conversaciones - Crear nueva conversación
router.post('/alfred/conversaciones', requireAuth, async (req: Request, res: Response) => {
    const usuario = (req.session as any)?.usuario;
    const userId = usuario.id;
    const { titulo } = req.body;

    try {
        const convTitle = (titulo && String(titulo).trim()) ? String(titulo).trim().slice(0, 100) : 'Nueva conversación';
        const result = await pool.query(
            `INSERT INTO alfred_conversaciones (usuario_id, titulo) VALUES ($1, $2) RETURNING id, titulo, creado_en, actualizado_en`,
            [userId, convTitle]
        );
        return res.status(201).json({
            conversacion: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error al crear conversación de Alfred:', error);
        return res.status(500).json({ error: 'Error al crear conversación' });
    }
});

// GET /api/alfred/conversaciones/:id - Obtener mensajes de una conversación
router.get('/alfred/conversaciones/:id', requireAuth, async (req: Request, res: Response) => {
    const usuario = (req.session as any)?.usuario;
    const userId = usuario.id;
    const convId = Number(req.params.id);

    if (isNaN(convId) || convId <= 0) {
        return res.status(400).json({ error: 'ID de conversación inválido' });
    }

    try {
        const convQ = await pool.query(
            'SELECT id, titulo, creado_en, actualizado_en FROM alfred_conversaciones WHERE id = $1 AND usuario_id = $2',
            [convId, userId]
        );
        if (convQ.rows.length === 0) {
            return res.status(404).json({ error: 'Conversación no encontrada o no autorizada.' });
        }

        const msgsQ = await pool.query(
            'SELECT id, rol, contenido, creado_en FROM alfred_mensajes WHERE conversacion_id = $1 ORDER BY id ASC',
            [convId]
        );

        return res.json({
            conversacion: convQ.rows[0],
            mensajes: msgsQ.rows || []
        });
    } catch (error: any) {
        console.error('Error al recuperar mensajes de conversación:', error);
        return res.status(500).json({ error: 'Error al recuperar mensajes' });
    }
});

// DELETE /api/alfred/conversaciones/:id - Eliminar conversación
router.delete('/alfred/conversaciones/:id', requireAuth, async (req: Request, res: Response) => {
    const usuario = (req.session as any)?.usuario;
    const userId = usuario.id;
    const convId = Number(req.params.id);

    if (isNaN(convId) || convId <= 0) {
        return res.status(400).json({ error: 'ID de conversación inválido' });
    }

    try {
        const delQ = await pool.query(
            'DELETE FROM alfred_conversaciones WHERE id = $1 AND usuario_id = $2 RETURNING id',
            [convId, userId]
        );
        if (delQ.rows.length === 0) {
            return res.status(404).json({ error: 'Conversación no encontrada.' });
        }
        return res.json({ success: true, message: 'Conversación eliminada exitosamente' });
    } catch (error: any) {
        console.error('Error al eliminar conversación:', error);
        return res.status(500).json({ error: 'Error al eliminar conversación' });
    }
});

// ==============================================================================
// CHAT CON GROQ AI (Streaming y Modo Estándar)
// POST /api/alfred/chat
// ==============================================================================
router.post('/alfred/chat', requireAuth, async (req: Request, res: Response) => {
    const usuario = (req.session as any)?.usuario;
    const userId = usuario.id;
    const userRole = usuario.rol || 'alumno';
    const userName = usuario.nombre_completo || 'Usuario';

    const { message, conversacionId, stream } = req.body;

    const promptText = (message || '').trim();
    if (!promptText) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    try {
        // 1. Obtener o crear conversación en PostgreSQL
        let activeConvId = conversacionId ? Number(conversacionId) : null;

        if (activeConvId) {
            const check = await pool.query(
                'SELECT id, titulo FROM alfred_conversaciones WHERE id = $1 AND usuario_id = $2',
                [activeConvId, userId]
            );
            if (check.rows.length === 0) {
                activeConvId = null;
            }
        }

        if (!activeConvId) {
            const initialTitle = promptText.length > 40 ? promptText.slice(0, 40) + '...' : promptText;
            const newConv = await pool.query(
                'INSERT INTO alfred_conversaciones (usuario_id, titulo) VALUES ($1, $2) RETURNING id',
                [userId, initialTitle]
            );
            activeConvId = newConv.rows[0].id;
        }

        // 2. Guardar mensaje del usuario en PostgreSQL
        await pool.query(
            'INSERT INTO alfred_mensajes (conversacion_id, rol, contenido) VALUES ($1, $2, $3)',
            [activeConvId, 'user', promptText]
        );

        // 3. Cargar historial cronológico para contexto de la IA
        const historyRows = await pool.query(
            'SELECT rol, contenido FROM alfred_mensajes WHERE conversacion_id = $1 ORDER BY id ASC',
            [activeConvId]
        );

        const aiHistory: GroqMessage[] = historyRows.rows.map((r: any) => ({
            role: r.rol === 'assistant' ? 'assistant' as const : 'user' as const,
            content: r.contenido
        }));

        // 4. Si se solicitó streaming progresivo (SSE)
        if (stream === true) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders?.();

            let fullAssistantResponse = '';

            try {
                const streamResult = await GroqService.streamResponse({
                    userId,
                    messages: aiHistory,
                    userRole,
                    userName,
                    onChunk: (chunk: string) => {
                        res.write(`data: ${JSON.stringify({ chunk, conversacionId: activeConvId })}\n\n`);
                    }
                });

                fullAssistantResponse = streamResult.fullText;

                // Guardar respuesta del asistente en PostgreSQL
                await pool.query(
                    'INSERT INTO alfred_mensajes (conversacion_id, rol, contenido, tokens) VALUES ($1, $2, $3, $4)',
                    [activeConvId, 'assistant', fullAssistantResponse, streamResult.outputTokens || 0]
                );

                // Actualizar fecha de conversación
                await pool.query(
                    'UPDATE alfred_conversaciones SET actualizado_en = CURRENT_TIMESTAMP WHERE id = $1',
                    [activeConvId]
                );

                res.write(`data: ${JSON.stringify({ done: true, conversacionId: activeConvId, model: streamResult.model })}\n\n`);
                return res.end();
            } catch (streamErr: any) {
                console.error('Error durante streaming de Groq AI:', streamErr.message || streamErr);
                res.write(`data: ${JSON.stringify({ error: streamErr.message || 'Error en streaming de Groq AI', done: true })}\n\n`);
                return res.end();
            }
        }

        // 5. Modo estándar (JSON no streaming)
        const aiResult = await GroqService.generateResponse({
            userId,
            messages: aiHistory,
            userRole,
            userName
        });

        // Guardar respuesta de Alfred en PostgreSQL
        const insertAssistant = await pool.query(
            'INSERT INTO alfred_mensajes (conversacion_id, rol, contenido, tokens) VALUES ($1, $2, $3, $4) RETURNING id, creado_en',
            [activeConvId, 'assistant', aiResult.reply, aiResult.outputTokens || 0]
        );

        await pool.query(
            'UPDATE alfred_conversaciones SET actualizado_en = CURRENT_TIMESTAMP WHERE id = $1',
            [activeConvId]
        );

        return res.json({
            reply: aiResult.reply,
            response: aiResult.reply,
            conversacionId: activeConvId,
            mensajeId: insertAssistant.rows[0].id,
            model: aiResult.model
        });
    } catch (error: any) {
        console.error('Error en /api/alfred/chat:', error.message || error);
        return res.status(500).json({
            error: error.message || 'Error al comunicarse con Alfred',
            reply: error.message || 'Lo siento, ocurrió un error al procesar tu consulta con Alfred.'
        });
    }
});

// ==============================================================================
// RUTA COMPATIBLE: /ask-alfred
// Redirige a Groq AI manteniendo compatibilidad con versiones previas
// ==============================================================================
router.post('/ask-alfred', requireAuth, async (req: Request<{}, {}, AskAlfredBody>, res: Response) => {
    const usuario = (req.session as any)?.usuario;
    const userId = usuario.id;
    const userRole = usuario.rol || 'alumno';
    const userName = usuario.nombre_completo || 'Usuario';

    let chatHistory = req.body.chatHistory;
    const rawInput = req.body.message || req.body.prompt;

    // Normalizar entrada libre a array de mensajes
    let messagesForAI: GroqMessage[] = [];

    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        messagesForAI = chatHistory.map(ch => ({
            role: ch.role === 'model' ? 'assistant' as const : 'user' as const,
            content: ch.parts?.map(p => p.text).join('\n') || ''
        }));
    } else if (rawInput) {
        messagesForAI = [{ role: 'user' as const, content: String(rawInput).trim() }];
    }

    if (messagesForAI.length === 0) {
        return res.status(400).json({
            error: 'Entrada inválida',
            reply: 'Debes enviar un mensaje o historial de chat válido.'
        });
    }

    // 1. Si Groq está configurado en backend, usamos Groq como motor principal
    if (GroqService.isConfigured()) {
        try {
            console.log(`🤖 [Alfred Backend] Procesando consulta con Groq API (${GroqService.getModel()})`);
            const aiResp = await GroqService.generateResponse({
                userId,
                messages: messagesForAI,
                userRole,
                userName
            });

            return res.json({
                response: aiResp.reply,
                reply: aiResp.reply,
                message: aiResp.reply,
                model: aiResp.model
            });
        } catch (aiError: any) {
            console.error('❌ [Alfred Backend] Error con Groq API:', aiError.message);
            return res.status(500).json({
                error: aiError.message,
                reply: aiError.message || 'Error al conectar con el servicio de IA.'
            });
        }
    }

    // 2. Si no hay Groq, verificar si hay GEMINI_API_KEY como respaldo
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (geminiKey) {
        try {
            console.log(`🤖 [Alfred Backend] Groq no configurado, utilizando respaldo Gemini`);
            const payload = {
                contents: messagesForAI.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }))
            };
            const apiResponse = await callGeminiWithRetry(geminiKey, payload);
            const replyText = apiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Respuesta recibida.';
            return res.json({
                response: replyText,
                reply: replyText,
                message: replyText
            });
        } catch (geminiErr: any) {
            console.error('❌ [Alfred Backend] Error de respaldo Gemini:', geminiErr.message);
        }
    }

    // 3. Ninguna clave configurada
    return res.status(503).json({
        error: 'Servicio de IA de Alfred no configurado.',
        reply: 'Disculpe, la clave de API oficial de Groq (GROQ_API_KEY) no está configurada en el archivo backend/.env.'
    });
});

// ==========================================================
// RUTA DE RECUPERACIÓN DE CONTRASEÑA ASISTIDA: /generate-password
// ==========================================================
router.post('/generate-password', async (req: Request<{}, {}, GeneratePasswordBody>, res: Response) => {
    const { email, context } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'El correo es requerido.', reply: 'Debes indicar un correo.' });
    }

    try {
        const userQuery = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Correo no encontrado.', reply: 'No encontramos ese correo en el sistema.' });
        }
        const userId = userQuery.rows[0].id_usuario;

        if (isInstitutionalEmail(email)) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            await pool.query(
                `INSERT INTO email_verifications (user_id, code, expires_at, used)
                 VALUES ($1, $2, $3, false)`,
                [userId, code, expiresAt]
            );
            try {
                await sendVerificationEmail(email, code);
                return res.status(200).json({
                    verificationRequired: true,
                    reply: 'Te envié un código al correo institucional. Pásame el código aquí para verificar que el correo es tuyo.'
                });
            } catch (mailErr) {
                console.error('Error enviando email de verificación:', mailErr);
                return res.status(500).json({
                    error: 'No se pudo enviar el email de verificación.',
                    reply: 'No pude enviar el código al correo. Revisa la configuración de correo o intenta nuevamente.'
                });
            }
        } else {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
            let newPassword = '';
            for (let i = 0; i < 12; i++) {
                newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
            }

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
        return res.status(500).json({ error: 'Error interno.', reply: 'Ocurrió un error interno al procesar la contraseña.' });
    }
});

// ==========================================================
// RUTA 3: /verify-email-code
// ==========================================================
router.post('/verify-email-code', async (req: Request<{}, {}, { email: string; code: string; context?: string }>, res: Response) => {
    const { email, code } = req.body;
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

        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
        let newPassword = '';
        for (let i = 0; i < 12; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hashedPassword, userId]);
        await pool.query('UPDATE email_verifications SET used = true WHERE id = $1', [row.id]);

        return res.status(200).json({
            success: true,
            password: newPassword,
            reply: 'Código verificado. Contraseña generada y actualizada correctamente.'
        });
    } catch (err: any) {
        console.error('Error en /verify-email-code:', err);
        return res.status(500).json({ error: 'Error interno al verificar el código.', reply: 'Error interno. Intenta nuevamente.' });
    }
});

// Helper de compatibilidad: llamada de respaldo a Gemini si está configurado
async function callGeminiWithRetry(apiKey: string, payload: any, maxAttempts = 2) {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const candidateModels = Array.from(new Set([primaryModel, 'gemini-2.5-flash', 'gemini-1.5-flash']));

    let lastErr: any = null;

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
                const resp = await axios.post(apiUrl, payload, { headers, timeout: 15000 });
                return resp;
            } catch (err: any) {
                lastErr = err;
                const status = err?.response?.status;
                if (status === 401) throw err;
                if (status === 404) break;
                await delay(1000);
            }
        }
    }
    throw lastErr || new Error('Error al conectar con la API de IA');
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default router;
