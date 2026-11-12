import { API_URL } from '../../../../frontend/src/config/api';

export interface TrabajoItem {
  id: number;
  clase_id: number;
  titulo: string;
  descripcion?: string | null;
  instrucciones?: string | null;
  fecha_limite?: string | null;
  puntos_max: number;
  tipo_entrega: 'individual' | 'grupal';
  creado_por: number;
  creador_nombre?: string;
  fecha_creacion: string;
  mi_entrega?: {
    entrega_id: number;
    estado: string;
    calificacion?: number | null;
    feedback?: string | null;
    fecha_entrega: string;
  } | null;
  mi_estado?: string;
}

export interface EntregaItem {
  id: number;
  trabajo_id: number;
  alumno_id: number;
  alumno_nombre: string;
  alumno_correo: string;
  alumno_dni?: string;
  archivo_nombre?: string | null;
  archivo_path?: string | null;
  comentario?: string | null;
  calificacion?: number | null;
  feedback?: string | null;
  estado: string;
  fecha_entrega: string;
  fecha_calificacion?: string | null;
}

export interface ConsultaItem {
  id: number;
  clase_id: number;
  trabajo_id?: number | null;
  usuario_id: number;
  usuario_nombre: string;
  usuario_rol: string;
  mensaje: string;
  fecha: string;
}

export interface MetricasClase {
  totalTrabajos: number;
  totalEntregas: number;
  corregidas: number;
  pendientes: number;
  promedioGeneral: number;
}

export interface ClaseOption {
  id: number;
  nombre: string;
  materia?: string;
  seccion?: string;
}

const PLUGIN_BASE = `${API_URL}/plugins/aula-activa`;

export const AulaActivaAPI = {
  async getHealth() {
    const res = await fetch(`${PLUGIN_BASE}/health`, { credentials: 'include' });
    const json = await res.json();
    return json;
  },

  async getClasesDocente(): Promise<ClaseOption[]> {
    const res = await fetch(`${API_URL}/profesor/clases`, { credentials: 'include' });
    const json = await res.json();
    return json.clases || json.data || [];
  },

  async getClasesAlumno(): Promise<ClaseOption[]> {
    const res = await fetch(`${API_URL}/alumno/clases`, { credentials: 'include' });
    const json = await res.json();
    return json.clases || json.data || [];
  },

  async getTrabajos(claseId: number): Promise<TrabajoItem[]> {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}/trabajos`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al listar trabajos');
    return json.data || [];
  },

  async crearTrabajo(claseId: number, data: {
    titulo: string;
    descripcion?: string;
    instrucciones?: string;
    fecha_limite?: string;
    puntos_max?: number;
    tipo_entrega?: string;
  }) {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}/trabajos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear trabajo');
    return json;
  },

  async modificarTrabajo(trabajoId: number, data: any) {
    const res = await fetch(`${PLUGIN_BASE}/trabajos/${trabajoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar trabajo');
    return json;
  },

  async eliminarTrabajo(trabajoId: number) {
    const res = await fetch(`${PLUGIN_BASE}/trabajos/${trabajoId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar trabajo');
    return json;
  },

  async getEntregasTrabajo(trabajoId: number): Promise<EntregaItem[]> {
    const res = await fetch(`${PLUGIN_BASE}/trabajos/${trabajoId}/entregas`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener entregas');
    return json.data || [];
  },

  async entregarTrabajo(trabajoId: number, data: { comentario?: string; archivo?: File }) {
    let body: any;
    const headers: Record<string, string> = {};

    if (data.archivo) {
      const formData = new FormData();
      formData.append('archivo', data.archivo);
      if (data.comentario) formData.append('comentario', data.comentario);
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ comentario: data.comentario || '' });
    }

    const res = await fetch(`${PLUGIN_BASE}/trabajos/${trabajoId}/entregar`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al entregar tarea');
    return json;
  },

  async calificarEntrega(entregaId: number, calificacion: number, feedback?: string) {
    const res = await fetch(`${PLUGIN_BASE}/entregas/${entregaId}/calificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ calificacion, feedback }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al calificar entrega');
    return json;
  },

  async getConsultas(claseId: number, trabajoId?: number): Promise<ConsultaItem[]> {
    let url = `${PLUGIN_BASE}/clases/${claseId}/consultas`;
    if (trabajoId) url += `?trabajo_id=${trabajoId}`;
    const res = await fetch(url, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener consultas');
    return json.data || [];
  },

  async publicarConsulta(claseId: number, mensaje: string, trabajoId?: number) {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}/consultas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mensaje, trabajo_id: trabajoId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al publicar consulta');
    return json;
  },

  async getMetricasClase(claseId: number): Promise<MetricasClase> {
    const res = await fetch(`${PLUGIN_BASE}/clases/${claseId}/metricas`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener métricas');
    return json.data;
  },
};

export default AulaActivaAPI;

