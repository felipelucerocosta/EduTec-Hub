/**
 * ============================================================================
 * ARCHIVO: email_service.ts
 * PLUGIN: EduTech Oportunidades — Portal de Pasantías y Proyectos
 * ROL ARQUITECTURAL: Servicio de Notificaciones por Correo Electrónico
 * ============================================================================
 * 
 * ARQUITECTURA:
 * - REMITENTE CENTRALIZADO: Integrado con `EmailCentralService` de EduTec-Hub.
 *   Utiliza una única cuenta autorizada central en el backend sin requerir
 *   que cada docente o alumno configure credenciales ni autorizaciones.
 * - DESTINATARIOS DINÁMICOS:
 *   Soporta cualquier dirección válida (Gmail, Outlook, Hotmail, Yahoo, dominios institucionales).
 *   El docente recibe el aviso en el correo que indicó en la convocatoria.
 *   El alumno recibe la confirmación en el correo con el que se registró.
 * - AUDITORÍA TRANSPARENTE:
 *   Registra cada intento en la tabla `plugin_oportunidades_notificaciones`.
 */

import pool from '../../../../backend/conexion_pg';
import { EmailCentralService } from '../../../../backend/services/email_central_service';

export interface EmailPostulacionPayload {
  postulacionId?: number;
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

export interface EmailConfirmacionAlumnoPayload {
  postulacionId?: number;
  destinatarioEmail: string;
  profesorEmail?: string;
  alumnoNombre: string;
  oportunidadTitulo: string;
  institucion: string;
  fechaPostulacion: string;
  motivacion?: string;
}

/**
 * Validador agnóstico de formato de correo electrónico.
 * Acepta cualquier proveedor (Gmail, Outlook, Hotmail, Yahoo, institucionales, etc.).
 * No restringe por listas blancas de dominios.
 */
export function validarFormatoEmail(email: string | undefined | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export class EmailOportunidadesService {
  /**
   * Registra en la base de datos el resultado del intento de envío para auditoría.
   */
  public static async registrarAuditoriaEnvio(
    postulacionId: number | undefined,
    destinatarioTipo: 'profesor' | 'alumno',
    destinatarioEmail: string,
    asunto: string,
    estado: 'enviado' | 'fallido' | 'omitido_sin_smtp',
    errorDetalle?: string
  ): Promise<void> {
    try {
      let validPostulacionId: number | null = null;
      if (postulacionId) {
        const check = await pool.query('SELECT id FROM plugin_oportunidades_postulaciones WHERE id = $1', [postulacionId]);
        if (check.rows.length > 0) {
          validPostulacionId = postulacionId;
        }
      }
      await pool.query(
        `INSERT INTO plugin_oportunidades_notificaciones 
         (postulacion_id, destinatario_tipo, destinatario_email, asunto, estado_envio, error_detalle)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [validPostulacionId, destinatarioTipo, destinatarioEmail, asunto, estado, errorDetalle || null]
      );
    } catch (err: any) {
      console.warn('⚠️ No se pudo registrar auditoría de correo en DB:', err.message);
    }
  }

  /**
   * 1. Notificación al Profesor/Responsable ante una nueva postulación estudiantil.
   */
  public static async notificarNuevaPostulacion(payload: EmailPostulacionPayload): Promise<{ sent: boolean; reason?: string; previewUrl?: string | false }> {
    const emailDestino = payload.destinatarioEmail?.trim();
    const subject = `[EduTech Oportunidades] Nueva postulación: ${payload.alumnoNombre} para ${payload.oportunidadTitulo}`;

    console.log(`📧 [Notificación Profesor] Preparando aviso para oportunidad "${payload.oportunidadTitulo}".`);
    console.log(`   Destinatario obtenido: ${emailDestino || '(vacío)'}`);

    if (!validarFormatoEmail(emailDestino)) {
      const errorMsg = `La dirección de correo del responsable no tiene un formato válido (${emailDestino}).`;
      console.error(`❌ [Notificación Profesor] ${errorMsg}`);
      await this.registrarAuditoriaEnvio(payload.postulacionId, 'profesor', emailDestino || 'sin-correo', subject, 'fallido', errorMsg);
      return { sent: false, reason: errorMsg };
    }

    const textContent = `
Estimado/a ${payload.responsableNombre || 'Responsable de Convocatoria'}:

Se ha registrado una nueva postulación en el portal de Oportunidades de EduTech.

Detalles de la postulación:
- Estudiante: ${payload.alumnoNombre}
- Correo Electrónico: ${payload.alumnoEmail}
${payload.alumnoDni ? `- DNI: ${payload.alumnoDni}\n` : ''}- Convocatoria: ${payload.oportunidadTitulo}
- Institución / Empresa: ${payload.institucion}
- Fecha y Hora: ${payload.fechaPostulacion}

${payload.motivacion ? `Motivación expresada por el estudiante:\n"${payload.motivacion}"\n` : ''}

Puede responder directamente a este correo para ponerse en contacto con el estudiante o acceder al panel de EduTech-Hub para gestionar el proceso de selección.
    `;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #070913; color: #f3f0ff; padding: 28px; border-radius: 14px; border: 1px solid rgba(121, 41, 210, 0.35);">
        <div style="border-bottom: 2px solid #7929d2; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="color: #55ddf5; margin: 0; font-size: 22px;">EduTech — Portal de Oportunidades</h2>
          <p style="color: #a9a3c7; font-size: 13px; margin: 6px 0 0 0;">Notificación Oficial para el Responsable</p>
        </div>
        
        <p style="font-size: 15px;">Estimado/a <strong>${payload.responsableNombre || 'Responsable'}</strong>,</p>
        <p style="font-size: 14px; color: #cbd5e1;">Un estudiante se ha postulado a la convocatoria que gestionás en la plataforma:</p>

        <div style="background: #0d1222; padding: 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); margin: 20px 0;">
          <p style="margin: 6px 0; font-size: 14px;"><strong>Convocatoria:</strong> <span style="color: #9747ff;">${payload.oportunidadTitulo}</span></p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Institución / Empresa:</strong> ${payload.institucion}</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 12px 0;" />
          <p style="margin: 6px 0; font-size: 14px;"><strong>Estudiante Postulante:</strong> ${payload.alumnoNombre}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Correo de Contacto:</strong> <a href="mailto:${payload.alumnoEmail}" style="color: #55ddf5;">${payload.alumnoEmail}</a></p>
          ${payload.alumnoDni ? `<p style="margin: 6px 0; font-size: 14px;"><strong>DNI:</strong> ${payload.alumnoDni}</p>` : ''}
          <p style="margin: 6px 0; font-size: 14px;"><strong>Fecha y Hora de Envío:</strong> ${payload.fechaPostulacion}</p>
          ${payload.motivacion ? `<div style="margin-top: 14px; padding: 12px; background: rgba(121, 41, 210, 0.12); border-left: 3px solid #7929d2; border-radius: 4px;"><p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: #d8c5ff;">Motivación del Alumno:</p><p style="font-style: italic; color: #f3f0ff; margin: 0; font-size: 13px;">"${payload.motivacion}"</p></div>` : ''}
        </div>

        <p style="font-size: 13px; color: #a9a3c7; line-height: 1.5;">
          Podés responder directamente a este correo para comunicarte con el alumno o ingresar al panel de gestión de postulantes en EduTec-Hub.
        </p>
      </div>
    `;

    const result = await EmailCentralService.sendMail({
      to: emailDestino,
      replyTo: payload.alumnoEmail,
      fromAlias: 'EduTech Oportunidades',
      subject,
      text: textContent,
      html: htmlContent,
    });

    if (result.success) {
      await this.registrarAuditoriaEnvio(payload.postulacionId, 'profesor', emailDestino, subject, 'enviado');
      return { sent: true };
    } else {
      await this.registrarAuditoriaEnvio(payload.postulacionId, 'profesor', emailDestino, subject, 'fallido', result.error);
      return { sent: false, reason: result.error, previewUrl: result.previewUrl };
    }
  }

  /**
   * 2. Confirmación al Alumno tras completar exitosamente su postulación.
   */
  public static async notificarConfirmacionAlumno(payload: EmailConfirmacionAlumnoPayload): Promise<{ sent: boolean; reason?: string; previewUrl?: string | false }> {
    const emailDestino = payload.destinatarioEmail?.trim();
    const subject = `[EduTech Oportunidades] Confirmación de postulación: ${payload.oportunidadTitulo}`;

    console.log(`📧 [Confirmación Alumno] Preparando confirmación para estudiante "${payload.alumnoNombre}".`);
    console.log(`   Destinatario obtenido: ${emailDestino || '(vacío)'}`);

    if (!validarFormatoEmail(emailDestino)) {
      const errorMsg = `La dirección de correo del alumno no tiene un formato válido (${emailDestino}).`;
      console.error(`❌ [Confirmación Alumno] ${errorMsg}`);
      await this.registrarAuditoriaEnvio(payload.postulacionId, 'alumno', emailDestino || 'sin-correo', subject, 'fallido', errorMsg);
      return { sent: false, reason: errorMsg };
    }

    const textContent = `
Hola ${payload.alumnoNombre}:

Tu postulación para la convocatoria "${payload.oportunidadTitulo}" ha sido recibida con éxito en EduTech-Hub.

Resumen de tu solicitud:
- Convocatoria: ${payload.oportunidadTitulo}
- Institución / Empresa: ${payload.institucion}
- Fecha y Hora de Envío: ${payload.fechaPostulacion}

El responsable de la oportunidad ha sido notificado y evaluará tu perfil.
Podrás consultar el estado de tu postulación en cualquier momento ingresando a la sección "Mis Postulaciones" en la plataforma.

¡Éxitos en tu proceso formativo!
Equipo EduTech-Hub
    `;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #070913; color: #f3f0ff; padding: 28px; border-radius: 14px; border: 1px solid rgba(16, 185, 129, 0.35);">
        <div style="border-bottom: 2px solid #10b981; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="color: #34d399; margin: 0; font-size: 22px;">¡Postulación Registrada con Éxito!</h2>
          <p style="color: #a9a3c7; font-size: 13px; margin: 6px 0 0 0;">EduTech — Portal de Oportunidades Técnicas</p>
        </div>
        
        <p style="font-size: 15px;">Hola <strong>${payload.alumnoNombre}</strong>,</p>
        <p style="font-size: 14px; color: #cbd5e1;">Tu postulación fue recibida correctamente por el sistema y el responsable de la convocatoria ya fue notificado.</p>

        <div style="background: #0d1222; padding: 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); margin: 20px 0;">
          <p style="margin: 6px 0; font-size: 14px;"><strong>Convocatoria:</strong> <span style="color: #55ddf5;">${payload.oportunidadTitulo}</span></p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Institución / Empresa:</strong> ${payload.institucion}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Fecha y Hora de Envío:</strong> ${payload.fechaPostulacion}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Estado Inicial:</strong> <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">En Revisión</span></p>
        </div>

        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
          Podés ingresar en cualquier momento a <strong>EduTech-Hub &gt; Oportunidades &gt; Mis Postulaciones</strong> para verificar las novedades y ver si el responsable aceptó tu postulación o te dejó un comentario.
        </p>

        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 18px 0;" />
        <p style="font-size: 12px; color: #6b6688; text-align: center;">
          Este es un aviso automático generado por EduTec-Hub.
        </p>
      </div>
    `;

    const result = await EmailCentralService.sendMail({
      to: emailDestino,
      replyTo: payload.profesorEmail,
      fromAlias: 'EduTech Oportunidades',
      subject,
      text: textContent,
      html: htmlContent,
    });

    if (result.success) {
      await this.registrarAuditoriaEnvio(payload.postulacionId, 'alumno', emailDestino, subject, 'enviado');
      return { sent: true };
    } else {
      await this.registrarAuditoriaEnvio(payload.postulacionId, 'alumno', emailDestino, subject, 'fallido', result.error);
      return { sent: false, reason: result.error, previewUrl: result.previewUrl };
    }
  }
}

export default EmailOportunidadesService;
