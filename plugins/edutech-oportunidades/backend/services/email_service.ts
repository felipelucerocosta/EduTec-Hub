let nodemailer: any = null;
try {
  nodemailer = require('nodemailer');
} catch (_e) {
  try {
    nodemailer = require('../../../../backend/node_modules/nodemailer');
  } catch (_e2) {
    nodemailer = null;
  }
}

export interface EmailPostulacionPayload {
  destinatarioEmail: string;
  responsableNombre?: string;
  oportunidadTitulo: string;
  institucion: string;
  alumnoNombre: string;
  alumnoEmail: string;
  alumnoDni?: string;
  fechaPostulacion: string;
  motivacion?: string;
}

export class EmailOportunidadesService {
  private static transporter: any = null;

  private static getTransporter(): any {
    if (this.transporter) return this.transporter;
    if (!nodemailer) return null;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return null;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      return this.transporter;
    } catch (err) {
      console.warn('⚠️ [Plugin Oportunidades] No se pudo inicializar transporte SMTP:', err);
      return null;
    }
  }

  /**
   * Envía notificación por correo electrónico al responsable de la oportunidad.
   */
  public static async notificarNuevaPostulacion(payload: EmailPostulacionPayload): Promise<{ sent: boolean; reason?: string }> {
    const transporter = this.getTransporter();

    const subject = `[EduTech Oportunidades] Nueva postulación: ${payload.alumnoNombre} para ${payload.oportunidadTitulo}`;
    const textContent = `
Estimado/a ${payload.responsableNombre || 'Responsable de Proyecto'}:

Se ha registrado una nueva postulación en el portal de Oportunidades de EduTech.

Detalles de la postulación:
- Estudiante: ${payload.alumnoNombre}
- Correo Electrónico: ${payload.alumnoEmail}
${payload.alumnoDni ? `- DNI: ${payload.alumnoDni}\n` : ''}- Convocatoria: ${payload.oportunidadTitulo}
- Institución: ${payload.institucion}
- Fecha y Hora: ${payload.fechaPostulacion}

${payload.motivacion ? `Motivación expresada por el alumno:\n"${payload.motivacion}"\n` : ''}

Puede acceder a EduTech-Hub para revisar la postulación completa y gestionar el proceso de selección.
    `;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
        <div style="border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="color: #38bdf8; margin: 0;">EduTech — Portal de Oportunidades</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">Notificación Oficial de Postulación Estudiantil</p>
        </div>
        
        <p>Estimado/a <strong>${payload.responsableNombre || 'Responsable'}</strong>,</p>
        <p>Un estudiante se ha postulado a la convocatoria institucional:</p>

        <div style="background: rgba(30, 41, 59, 0.7); padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin: 16px 0;">
          <p style="margin: 6px 0;"><strong>Convocatoria:</strong> ${payload.oportunidadTitulo}</p>
          <p style="margin: 6px 0;"><strong>Institución:</strong> ${payload.institucion}</p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 12px 0;" />
          <p style="margin: 6px 0;"><strong>Estudiante:</strong> ${payload.alumnoNombre}</p>
          <p style="margin: 6px 0;"><strong>Correo de contacto:</strong> <a href="mailto:${payload.alumnoEmail}" style="color: #38bdf8;">${payload.alumnoEmail}</a></p>
          ${payload.alumnoDni ? `<p style="margin: 6px 0;"><strong>DNI:</strong> ${payload.alumnoDni}</p>` : ''}
          <p style="margin: 6px 0;"><strong>Fecha:</strong> ${payload.fechaPostulacion}</p>
          ${payload.motivacion ? `<p style="margin: 12px 0 4px 0;"><strong>Motivación:</strong></p><p style="font-style: italic; color: #cbd5e1; margin: 0;">"${payload.motivacion}"</p>` : ''}
        </div>

        <p style="font-size: 13px; color: #94a3b8;">
          Puede contactar directamente al alumno respondiendo a su correo institucional o ingresando al panel de EduTech.
        </p>
      </div>
    `;

    if (!transporter) {
      console.log(`ℹ️ [Plugin Oportunidades - Email Service] SMTP no configurado. Notificación simulada para responsable: ${payload.destinatarioEmail}`);
      console.log(`   Asunto: ${subject}`);
      return { sent: false, reason: 'SMTP no configurado en variables de entorno' };
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"EduTech Oportunidades" <no-reply@edutechhub.edu.ar>',
        to: payload.destinatarioEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`📧 [Plugin Oportunidades] Notificación enviada con éxito a ${payload.destinatarioEmail}`);
      return { sent: true };
    } catch (err: any) {
      console.error(`❌ [Plugin Oportunidades] Error al enviar email a ${payload.destinatarioEmail}:`, err.message);
      return { sent: false, reason: err.message };
    }
  }
}

export default EmailOportunidadesService;
