import { Router, type Request, type Response } from 'express';
import 'express-session';
import pool from './conexion_be';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

const router = Router();

declare module 'express-session' {
  interface SessionData {
    usuario?: {
      id: number;
      rol?: string;
      [key: string]: any;
    };
  }
}

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

// Contador de intentos fallidos en memoria (clave = correo)
type AttemptRecord = { count: number; lastAttempt: number };
const attempts = new Map<string, AttemptRecord>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // ventana de 15 minutos
const ATTEMPT_THRESHOLD = 3;

// Función para notificar por email (falla suave si no está configurado)
async function notifyFailedAttempts(email: string) {
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
    } catch (err) {
      console.error('Error enviando notificación de intentos fallidos:', err);
    }
  } else {
    console.log('Mail transporter no configurado. Notificación (simulada):', { email, subject, text });
  }
}

// Función para notificar login exitoso por email
async function notifySuccessfulLogin(email: string) {
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
    } catch (err) {
      console.error('Error enviando notificación de login exitoso:', err);
    }
  } else {
    console.log('Mail transporter no configurado. Notificación de login exitoso (simulada):', { email, subject, text });
  }
}

// --- RUTA DE LOGIN ---
router.post('/login', async (req: Request, res: Response) => {
  const correo: string = req.body.correo ? String(req.body.correo).trim() : '';
  const contrasena: string = req.body.contrasena ? String(req.body.contrasena).trim() : '';

  if (!correo || !contrasena) {
    return res.status(400).json({ success: false, message: 'Faltan correo o contraseña.' });
  }

  // Validar dominio institucional
  if (!correo.endsWith('@alu.tecnica29de6.edu.ar') && !correo.endsWith('@tecnica29de6.edu.ar')) {
    return res.status(400).json({ success: false, message: 'Solo se permiten correos institucionales.' });
  }

  try {
    const userQuery = 'SELECT * FROM usuarios WHERE correo = $1';
    const result: any = await pool.query(userQuery, [correo]);

    if (!result || !Array.isArray(result.rows) || result.rows.length === 0) {
      // Incrementar intento fallido incluso si el correo no existe (para evitar enumeración no revelamos)
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

    // Login correcto -> limpiar contador
    attempts.delete(correo);

    let rol = 'alumno';
    const profesorQuery = 'SELECT * FROM profesor WHERE id_usuario = $1';
    const profesorResult: any = await pool.query(profesorQuery, [usuario.id_usuario]);

    if (profesorResult && Array.isArray(profesorResult.rows) && profesorResult.rows.length > 0) {
      rol = 'profesor';
    }

    (req.session as any).usuario = {
      id: Number(usuario.id_usuario),
      nombre: usuario.nombre_completo || '',
      correo: usuario.correo || correo,
      rol
    };

    // Enviar notificación de login exitoso por email
    await notifySuccessfulLogin(correo);

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      // 2. CORRECCIÓN: Devuelve 'rol' en el objeto 'usuario'
      usuario: {
        id: Number(usuario.id_usuario),
        nombre: usuario.nombre_completo || '',
        correo: usuario.correo || correo,
        rol
      }
    });
  } catch (err) {
    console.error('Error en la consulta de login:', err);
    res.status(5.00).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Manejo de intento fallido: incrementa contador, notifica al llegar al umbral
async function handleFailedAttempt(correo: string) {
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
router.post('/forgot-password', async (req: Request, res: Response) => {
  const correo = req.body.correo ? String(req.body.correo).trim() : '';
  if (!correo) return res.status(400).json({ success: false, message: 'Correo requerido.' });

  try {
    const userQ = 'SELECT id_usuario, correo FROM usuarios WHERE correo = $1';
    const userResult: any = await pool.query(userQ, [correo]);

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
    await pool.query('DELETE FROM password_resets WHERE id_usuario = $1', [user.id_usuario]);

    // Insertar nuevo token
    await pool.query(
      'INSERT INTO password_resets(token, id_usuario, expires_at) VALUES($1, $2, $3)',
      [token, user.id_usuario, expiresAt]
    );

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
    } else {
      // Fallback: log
      console.log('Mail transporter no configurado. Link de reseteo (usar en desarrollo):', resetLink);
    }

    return res.status(200).json({ success: true, message: 'Si existe una cuenta con ese correo, se ha enviado un enlace de recuperación.' });
  } catch (err) {
    console.error('Error en forgot-password:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// GET /reset-password/validate?token= -> validar token
router.get('/reset-password/validate', async (req: Request, res: Response) => {
  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ valid: false, message: 'Token requerido.' });

  try {
    const q = 'SELECT id_usuario, expires_at FROM password_resets WHERE token = $1';
    const r: any = await pool.query(q, [token]);

    if (!r || !Array.isArray(r.rows) || r.rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'Token no encontrado o inválido.' });
    }

    const row = r.rows[0];
    if (new Date(row.expires_at) < new Date()) {
      return res.status(410).json({ valid: false, message: 'Token expirado.' });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error('Error validando token:', err);
    return res.status(500).json({ valid: false, message: 'Error interno.' });
  }
});

// POST /reset-password -> recibe token + nueva contraseña, actualiza usuario y borra token
router.post('/reset-password', async (req: Request, res: Response) => {
  const token = req.body.token ? String(req.body.token) : '';
  const nueva = req.body.contrasena ? String(req.body.contrasena) : '';

  if (!token || !nueva) return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos.' });
  if (nueva.length < 6) return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });

  try {
    const q = 'SELECT id_usuario, expires_at FROM password_resets WHERE token = $1';
    const r: any = await pool.query(q, [token]);

    if (!r || !Array.isArray(r.rows) || r.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Token inválido.' });
    }

    const row = r.rows[0];
    if (new Date(row.expires_at) < new Date()) {
      // borrar token expirado
      await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);
      return res.status(410).json({ success: false, message: 'Token expirado.' });
    }

    const hashed = await bcrypt.hash(nueva, 10);
    await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hashed, row.id_usuario]);

    // eliminar token usado
    await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);

    return res.status(200).json({ success: true, message: 'Contraseña restablecida correctamente.' });
  } catch (err) {
    console.error('Error en reset-password:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

export default router;