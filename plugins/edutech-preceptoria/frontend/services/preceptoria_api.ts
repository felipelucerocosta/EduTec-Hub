import { API_URL } from '../../../../frontend/src/config/api';

export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'JUSTIFICADO';

export interface ClasePreceptorOption {
  id: number;
  nombre: string;
  materia: string;
  seccion: string;
  aula?: string;
  codigo?: string;
  total_alumnos: number;
}

export interface AlumnoAsistenciaItem {
  alumno_id: number;
  nombre_completo: string;
  correo: string;
  DNI?: string;
  estado: EstadoAsistencia;
  observacion: string;
  existe_registro: boolean;
}

export interface PlanillaFechaData {
  sesion: {
    id: number;
    clase_id: number;
    fecha: string;
    preceptor_id: number;
    preceptor_nombre?: string;
    observaciones?: string;
    fecha_registro: string;
    ultima_modificacion?: string;
  } | null;
  alumnos: AlumnoAsistenciaItem[];
}

export interface HistorialSesionItem {
  id: number;
  fecha: string;
  observaciones?: string;
  fecha_registro: string;
  ultima_modificacion?: string;
  preceptor_nombre: string;
  total_alumnos: number;
  presentes: number;
  ausentes: number;
  tardes: number;
  justificados: number;
}

export interface EstadisticasPreceptoria {
  totalSesiones: number;
  totalRegistros: number;
  presentes: number;
  ausentes: number;
  tardes: number;
  justificados: number;
  porcentajeAsistencia: number;
}

export interface PreceptorUsuarioItem {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  DNI?: string;
  total_clases_asignadas: number;
}

const PLUGIN_BASE = `${API_URL}/plugins/edutech-preceptoria`;

export const PreceptoriaAPI = {
  async getHealth() {
    const res = await fetch(`${PLUGIN_BASE}/health`, { credentials: 'include' });
    const json = await res.json();
    return json;
  },

  async getMisClases(): Promise<ClasePreceptorOption[]> {
    const res = await fetch(`${PLUGIN_BASE}/mis-clases`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener clases asignadas');
    return json.data || [];
  },

  async getPlanillaFecha(claseId: number, fecha: string): Promise<PlanillaFechaData> {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}/planilla?fecha=${fecha}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al cargar planilla de asistencia');
    return json.data;
  },

  async guardarAsistencia(claseId: number, fecha: string, observaciones: string, registros: {
    alumnoId: number;
    estado: EstadoAsistencia;
    observacion?: string;
  }[]) {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}/asistencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fecha, observaciones, registros }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar asistencia');
    return json;
  },

  async getHistorial(claseId: number): Promise<HistorialSesionItem[]> {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}/historial`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener historial');
    return json.data || [];
  },

  async getEstadisticas(claseId: number): Promise<EstadisticasPreceptoria> {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}/estadisticas`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener estadísticas');
    return json.data;
  },

  // Admin Endpoints
  async listarPreceptores(): Promise<PreceptorUsuarioItem[]> {
    const res = await fetch(`${PLUGIN_BASE}/admin/preceptores`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al listar preceptores');
    return json.data || [];
  },

  async asignarClase(preceptorId: number, claseId: number) {
    const res = await fetch(`${PLUGIN_BASE}/admin/asignar-clase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ preceptorId, claseId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al asignar clase');
    return json;
  },

  async revocarClase(preceptorId: number, claseId: number) {
    const res = await fetch(`${PLUGIN_BASE}/admin/revocar-clase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ preceptorId, claseId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al revocar asignación');
    return json;
  },
};

export default PreceptoriaAPI;

