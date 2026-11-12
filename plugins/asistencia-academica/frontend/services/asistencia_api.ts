import { API_URL } from '../../../../frontend/src/config/api';

export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'JUSTIFICADO';

export interface ClaseOption {
  id: number;
  nombre: string;
  materia: string;
  seccion: string;
  aula: string;
  codigo: string;
  total_alumnos: number;
}

export interface AlumnoRegistroItem {
  id: number | null;
  alumno_id: number;
  nombre_completo: string;
  correo: string;
  DNI: string;
  estado: EstadoAsistencia;
  observacion: string | null;
}

export interface SesionFechaItem {
  id: number;
  fecha: string;
  observaciones: string | null;
  fecha_registro: string;
  presentes: number;
  ausentes: number;
  tardes: number;
  justificados: number;
}

export interface ResumenMateriaAlumno {
  claseId: number;
  nombre: string;
  materia: string;
  seccion: string;
  aula: string;
  totalClases: number;
  presentes: number;
  ausentes: number;
  tardes: number;
  justificados: number;
  porcentaje: number;
  estadoRegularidad: 'REGULAR' | 'EN_RIESGO' | 'CRITICO';
}

export interface DetalleClaseAlumno {
  fecha: string;
  obs_clase: string | null;
  estado: EstadoAsistencia | null;
  observacion: string | null;
}

export interface EstadisticasAdminDivision {
  seccion: string;
  sesiones: number;
  presentes: number;
  ausentes: number;
  tardes: number;
  justificados: number;
  porcentaje: number;
}

export interface EstadisticasAdminData {
  totalSesiones: number;
  totalRegistros: number;
  divisiones: EstadisticasAdminDivision[];
}

const PLUGIN_BASE = `${API_URL}/plugins/asistencia-academica`;

export const AsistenciaAPI = {
  /**
   * Health check del plugin
   */
  async getHealth() {
    const res = await fetch(`${PLUGIN_BASE}/health`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener estado del plugin');
    return json.data;
  },

  /**
   * Obtener clases asignadas al docente
   */
  async getClasesDocente(): Promise<ClaseOption[]> {
    const res = await fetch(`${PLUGIN_BASE}/clases`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener clases');
    return json.data;
  },

  /**
   * Obtener fechas en que se tomó asistencia para una clase
   */
  async getFechasClase(claseId: number): Promise<SesionFechaItem[]> {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}/fechas`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener fechas');
    return json.data;
  },

  /**
   * Obtener planilla para una fecha
   */
  async getPlanilla(claseId: number, fecha?: string): Promise<{ sesion: any; alumnos: AlumnoRegistroItem[] }> {
    const query = fecha ? `?fecha=${fecha}` : '';
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}${query}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener planilla');
    return json.data;
  },

  /**
   * Guardar o actualizar planilla de asistencia
   */
  async guardarPlanilla(
    claseId: number,
    payload: {
      fecha: string;
      observaciones?: string;
      registros: { alumnoId: number; estado: EstadoAsistencia; observacion?: string }[];
    }
  ) {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar planilla');
    return json;
  },

  /**
   * Obtener resumen de regularidad del alumno logueado
   */
  async getResumenAlumno(): Promise<ResumenMateriaAlumno[]> {
    const res = await fetch(`${PLUGIN_BASE}/alumno/resumen`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener resumen de regularidad');
    return json.data;
  },

  /**
   * Obtener detalle fecha a fecha de un alumno en una clase
   */
  async getDetalleAlumnoClase(claseId: number): Promise<DetalleClaseAlumno[]> {
    const res = await fetch(`${PLUGIN_BASE}/alumno/clase/${claseId}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener detalle de inasistencias');
    return json.data;
  },

  /**
   * Obtener estadísticas consolidadas para administrador
   */
  async getEstadisticasAdmin(): Promise<EstadisticasAdminData> {
    const res = await fetch(`${PLUGIN_BASE}/admin/estadisticas`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener telemetría institucional');
    return json.data;
  },

  /**
   * Actas e Incidencias (Preceptoría)
   */
  async getActasClase(claseId: number) {
    const res = await fetch(`${PLUGIN_BASE}/actas/clase/${claseId}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener actas');
    return json.data;
  },

  async crearActa(payload: { clase_id: number; alumno_id?: number | null; tipo: string; descripcion: string; fecha: string }) {
    const res = await fetch(`${PLUGIN_BASE}/actas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear acta');
    return json;
  },

  async actualizarEstadoActa(id: number, estado: 'Abierta' | 'Resuelta') {
    const res = await fetch(`${PLUGIN_BASE}/actas/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ estado }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar acta');
    return json;
  },

  async eliminarActa(id: number) {
    const res = await fetch(`${PLUGIN_BASE}/actas/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar acta');
    return json;
  },
};

export default AsistenciaAPI;

