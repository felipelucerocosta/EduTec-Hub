/**
 * ============================================================================
 * ARCHIVO: backend/services/email_central_service.ts
 * PROYECTO: EduTec-Hub / TECH-ROOM 29
 * ROL ARQUITECTURAL: Servicio Central de Envíos de Correo Transaccional
 * ============================================================================
 * 
 * ARQUITECTURA DE ENVÍO:
 * 1. REMITENTE CENTRALIZADO:
 *    - Una única cuenta de correo autorizada para toda la plataforma EduTec-Hub.
 *    - Soporta autenticación SMTP estándar (Host, Puerto, TLS, User, Password)
 *      y autenticación moderna OAuth 2.0 (Client ID, Client Secret, Refresh Token).
 * 
 * 2. DESTINATARIOS COMPLETAMENTE DINÁMICOS:
 *    - Cada profesor o alumno introduce su correo personal o institucional
 *      (Gmail, Outlook, Hotmail, Yahoo, dominios .edu.ar o corporativos).
 *    - Ningún profesor o alumno necesita configurar contraseñas ni servicios SMTP.
 *    - Se incluye cabecera Reply-To para comunicación directa entre las partes.
 * 
 * 3. DIAGNÓSTICO Y TRANSPARENCIA ESTRICTA:
 *    - Nunca reporta éxito falso si el proveedor SMTP rechaza las credenciales.
 *    - Si el envío falla, registra el motivo técnico específico (EAUTH, ECONNREFUSED, etc.)
 *      sin exponer contraseñas ni datos sensibles en los logs.
 */

import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  fromAlias?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
  errorType?: 'AUTH' | 'CONNECTION' | 'REJECTED' | 'NOT_CONFIGURED' | 'UNKNOWN';
}

export class EmailCentralService {
  private static transporter: any = null;
  private static isConfigured = false;

  /**
   * Obtiene o inicializa el transporte de envío centralizado.
   */
  public static async getTransporter(): Promise<{ transporter: any; isConfigured: boolean }> {
    if (this.transporter) {
      return { transporter: this.transporter, isConfigured: this.isConfigured };
    }

    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.replace(/\s+/g, '').trim();
    const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

    // 1. Soporte para OAuth 2.0 (Google Workspace / Azure / Office 365)
    const oauthClientId = process.env.OAUTH_CLIENT_ID?.trim();
    const oauthClientSecret = process.env.OAUTH_CLIENT_SECRET?.trim();
    const oauthRefreshToken = process.env.OAUTH_REFRESH_TOKEN?.trim();

    if (user && oauthClientId && oauthClientSecret && oauthRefreshToken) {
      try {
        this.transporter = nodemailer.createTransport({
          service: process.env.SMTP_SERVICE || (host?.includes('gmail') ? 'gmail' : undefined),
          host: host || 'smtp.gmail.com',
          port: port || 465,
          secure: isSecure,
          auth: {
            type: 'OAuth2',
            user,
            clientId: oauthClientId,
            clientSecret: oauthClientSecret,
            refreshToken: oauthRefreshToken,
          },
          tls: { rejectUnauthorized: false },
        });
        this.isConfigured = true;
        console.log(`📧 [Email Central] Transporte OAuth2 inicializado con cuenta central: ${user}`);
        return { transporter: this.transporter, isConfigured: true };
      } catch (err: any) {
        console.warn('⚠️ [Email Central] Falló inicialización OAuth2:', err.message);
      }
    }

    // 2. Soporte para SMTP Tradicional (Gmail App Password, Brevo, Sendgrid, Outlook, etc.)
    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: isSecure,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.isConfigured = true;
        console.log(`📧 [Email Central] Transporte SMTP configurado: ${user} (${host}:${port}, secure=${isSecure})`);
        return { transporter: this.transporter, isConfigured: true };
      } catch (err: any) {
        console.warn('⚠️ [Email Central] Falló inicialización SMTP:', err.message);
      }
    }

    // 3. Si no hay credenciales SMTP en .env
    this.transporter = null;
    this.isConfigured = false;
    return { transporter: null, isConfigured: false };
  }

  /**
   * Envía un correo con remitente institucional centralizado y destinatario dinámico.
   */
  public static async sendMail(options: EmailOptions): Promise<EmailResult> {
    const { transporter, isConfigured } = await this.getTransporter();

    // Si no hay configuración SMTP en .env
    if (!isConfigured || !transporter) {
      const errorMsg = 'El servidor no tiene configuradas credenciales SMTP válidas en .env (SMTP_HOST, SMTP_USER, SMTP_PASS).';
      console.warn(`⚠️ [Email Central] Envío cancelado: ${errorMsg}`);

      // En desarrollo local sin SMTP, generar opcionalmente una previsualización de prueba sin marcar como entregado real
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        const info = await testTransporter.sendMail({
          from: `"EduTech-Hub (Modo Local)" <${testAccount.user}>`,
          to: options.to,
          replyTo: options.replyTo,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`🔗 [Email Central - Previsualización Local para Pruebas]: ${previewUrl}`);
        return {
          success: false,
          error: errorMsg,
          errorType: 'NOT_CONFIGURED',
          previewUrl: previewUrl || false,
        };
      } catch (_e) {
        return {
          success: false,
          error: errorMsg,
          errorType: 'NOT_CONFIGURED',
        };
      }
    }

    const defaultFrom = process.env.SMTP_FROM || `"EduTech-Hub Notificaciones" <${process.env.SMTP_USER}>`;
    const from = options.fromAlias ? `"${options.fromAlias}" <${process.env.SMTP_USER}>` : defaultFrom;

    try {
      console.log(`📤 [Email Central] Iniciando despacho hacia: ${options.to} (Asunto: "${options.subject}")`);
      const info = await transporter.sendMail({
        from,
        to: options.to,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`✅ [Email Central] Correo aceptado por el servidor SMTP.`);
      console.log(`   Remitente: ${from}`);
      console.log(`   Destinatario: ${options.to}`);
      if (options.replyTo) {
        console.log(`   Reply-To: ${options.replyTo}`);
      }
      console.log(`   Message-ID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      let errorType: EmailResult['errorType'] = 'UNKNOWN';
      let errorHuman = err.message || 'Error desconocido';

      if (err.code === 'EAUTH' || err.responseCode === 535 || err.message?.includes('535') || err.message?.includes('BadCredentials')) {
        errorType = 'AUTH';
        errorHuman = 'Credenciales SMTP rechazadas por el servidor de correo (535 BadCredentials). Verifique usuario y contraseña en .env.';
      } else if (err.code === 'ESOCKET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        errorType = 'CONNECTION';
        errorHuman = `No se pudo conectar al servidor SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT}).`;
      } else if (err.responseCode >= 500) {
        errorType = 'REJECTED';
        errorHuman = `El servidor SMTP rechazó el mensaje: ${err.response || err.message}`;
      }

      console.error(`❌ [Email Central] Falló el envío SMTP hacia ${options.to}:`, errorHuman);

      // Si las credenciales fallan, resetear transporter para que ante un cambio de .env se reinicialice
      this.resetTransporter();

      return {
        success: false,
        error: errorHuman,
        errorType,
      };
    }
  }

  /**
   * Resetea el transporte forzando su reinicialización ante cambios de configuración en .env
   */
  public static resetTransporter(): void {
    this.transporter = null;
    this.isConfigured = false;
  }
}

export default EmailCentralService;
