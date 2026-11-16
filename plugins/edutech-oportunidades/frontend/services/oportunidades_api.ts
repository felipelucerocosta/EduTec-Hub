/**
 * ============================================================================
 * ARCHIVO: oportunidades_api.ts
 * PLUGIN: EduTech Oportunidades — Portal de Pasantías y Proyectos
 * ROL ARQUITECTURAL: Cliente de Comunicación HTTP (Frontend Service / API Client)
 * ============================================================================
 * 
 * RESPONSABILIDAD:
 * Provee métodos fuertemente tipados para comunicarse con los endpoints REST
 * del plugin en el backend mediante la API Fetch nativa.
 * 
 * SEGURIDAD Y CREDENCIALES:
 * Todas las llamadas incluyen `{ credentials: 'include' }` para transmitir
 * automáticamente la cookie de sesión (`connect.sid`) de express-session.
 */

import { API_URL } from '../../../../frontend/src/config/api';

/**
 * Modelo de datos de una Oportunidad (Convocatoria) en el cliente.
 */
export interface OportunidadItem {
  id: number;
  titulo: string;
  institucion: string;
  descripcion: string;
  categoria: string;
  tipo_oportunidad: string;
  requisitos?: string | null;
  conocimientos?: string | null;
  nivel_educativo?: string | null;
  vacantes_totales: number;
  vacantes_ocupadas: number;
  fecha_publicacion: string;
  fecha_apertura?: string | null;
  fecha_cierre_inscripcion: string;
  fecha_inicio?: string | null;
  duracion?: string | null;
  modalidad: 'presencial' | 'virtual' | 'hibrida';
  ubicacion?: string | null;
  horarios?: string | null;
  responsable_id: number;
  responsable_nombre?: string;
  contacto_email: string;
  estado: 'abierta' | 'cerrada' | 'finalizada' | 'cancelada';
}

/**
 * Modelo de datos de una Postulación enviada por un alumno.
 */
export interface PostulacionItem {
  id: number;
  oportunidad_id: number;
  alumno_id: number;
  alumno_nombre?: string;
  alumno_correo?: string;
  alumno_dni?: string;
  oportunidad_titulo?: string;
  institucion?: string;
  categoria?: string;
  modalidad?: string;
  oportunidad_estado?: string;
  fecha_cierre_inscripcion?: string;
  presentacion?: string | null;
  motivacion?: string | null;
  conocimientos_previos?: string | null;
  disponibilidad?: string | null;
  estado: 'pendiente' | 'en_evaluacion' | 'entrevista' | 'aceptada' | 'rechazada' | 'cancelada' | 'lista_espera';
  fecha_postulacion: string;
  fecha_actualizacion: string;
  notas_responsable?: string | null;
}

/**
 * Métricas cuantitativas del responsable de convocatorias.
 */
export interface MetricasResponsable {
  totalOportunidades: number;
  totalPostulaciones: number;
  pendientes: number;
  aceptadas: number;
  rechazadas: number;
  entrevistas: number;
}

// Prefijo canónico de ruta del plugin en Express
const PLUGIN_BASE = `${API_URL}/plugins/oportunidades`;

export const OportunidadesAPI = {
  /**
   * Consulta el estado de salud del plugin (Health Check)
   */
  async getHealth() {
    const res = await fetch(`${PLUGIN_BASE}/health`, { credentials: 'include' });
    const json = await res.json();
    return json;
  },

  /**
   * Obtiene la lista de convocatorias disponibles aplicando filtros por query string.
   */
  async listarOportunidades(filtros: {
    categoria?: string;
    modalidad?: string;
    nivelEducativo?: string;
    estado?: string;
    busqueda?: string;
  }): Promise<OportunidadItem[]> {
    const params = new URLSearchParams();
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.modalidad) params.append('modalidad', filtros.modalidad);
    if (filtros.nivelEducativo) params.append('nivelEducativo', filtros.nivelEducativo);
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);

    const res = await fetch(`${PLUGIN_BASE}/oportunidades?${params.toString()}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al listar oportunidades');
    return json.data || [];
  },

  /**
   * Obtiene la ficha de detalle de una oportunidad por su ID.
   */
  async obtenerDetalle(id: number): Promise<OportunidadItem> {
    const res = await fetch(`${PLUGIN_BASE}/oportunidades/${id}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener detalle');
    return json.data;
  },

  /**
   * Crea una nueva convocatoria institucional enviando payload JSON (Docentes/Admin).
   */
  async crearOportunidad(data: {
    titulo: string;
    institucion: string;
    descripcion: string;
    categoria: string;
    tipo_oportunidad?: string;
    requisitos?: string;
    conocimientos?: string;
    nivel_educativo?: string;
    vacantes_totales: number;
    fecha_apertura?: string;
    fecha_cierre_inscripcion: string;
    fecha_inicio?: string;
    duracion?: string;
    modalidad?: string;
    ubicacion?: string;
    horarios?: string;
    contacto_email?: string;
  }) {
    const res = await fetch(`${PLUGIN_BASE}/oportunidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear convocatoria');
    return json;
  },

  /**
   * Envía la postulación de un estudiante a una convocatoria.
   */
  async postularse(oportunidadId: number, data: {
    presentacion?: string;
    motivacion?: string;
    conocimientos_previos?: string;
    disponibilidad?: string;
  }) {
    const res = await fetch(`${PLUGIN_BASE}/oportunidades/${oportunidadId}/postular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al enviar postulación');
    return json;
  },

  /**
   * Obtiene las postulaciones realizadas por el alumno en sesión.
   */
  async misPostulaciones(): Promise<PostulacionItem[]> {
    const res = await fetch(`${PLUGIN_BASE}/mis-postulaciones`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener mis postulaciones');
    return json.data || [];
  },

  /**
   * Cancela una postulación voluntariamente.
   */
  async cancelarPostulacion(id: number) {
    const res = await fetch(`${PLUGIN_BASE}/postulaciones/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al cancelar postulación');
    return json;
  },

  /**
   * Obtiene la lista de postulantes inscriptos en una convocatoria (para el responsable).
   */
  async verPostulantes(oportunidadId: number): Promise<PostulacionItem[]> {
    const res = await fetch(`${PLUGIN_BASE}/oportunidades/${oportunidadId}/postulantes`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al listar postulantes');
    return json.data || [];
  },

  /**
   * Actualiza el estado de una postulación (evaluar, aceptar, rechazar).
   */
  async actualizarEstadoPostulacion(postulacionId: number, estado: string, notas?: string) {
    const res = await fetch(`${PLUGIN_BASE}/postulaciones/${postulacionId}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ estado, notas }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar estado');
    return json;
  },

  /**
   * Obtiene los indicadores estadísticos de convocatorias del usuario logueado.
   */
  async getMetricas(): Promise<MetricasResponsable> {
    const res = await fetch(`${PLUGIN_BASE}/metricas`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener métricas');
    return json.data;
  },
};

export default OportunidadesAPI;
