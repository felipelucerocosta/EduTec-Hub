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

export interface RegistroAsistenciaAlumno {
  id: number;
  estado: EstadoAsistencia;
  observacion?: string;
  fecha: string;
  clase_nombre: string;
  materia_nombre: string;
}

export interface ConstanciaItem {
  id: number;
  alumno_id: number;
  preceptor_id?: number;
  alumno_nombre?: string;
  alumno_correo?: string;
  alumno_dni?: string;
  alumno_curso?: string;
  preceptor_nombre?: string;
  clase_nombre?: string;
  motivo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fecha_solicitud: string;
  fecha_resolucion?: string;
  observaciones?: string;
  codigo_verificacion?: string;
}

export interface RegistroAsistenciaDocente {
  id: number;
  profesor_id: number;
  fecha: string;
  estado: 'PRESENTE' | 'AUSENTE_JUSTIFICADO' | 'AUSENTE_INJUSTIFICADO' | 'TARDE';
  motivo?: string;
  observaciones?: string;
  modificado_por?: number;
  modificado_por_nombre?: string;
  fecha_modificacion?: string;
}

export interface MiAsistenciaDocenteData {
  profesorId: number;
  periodoAcademico: string;
  totalRegistros: number;
  asistenciasRegistradas: number;
  tardesRegistradas: number;
  totalInasistencias: number;
  inasistenciasJustificadas: number;
  inasistenciasInjustificadas: number;
  porcentajeAsistencia: number;
  estadoAsistencia: string;
  estadoColor: string;
  historial: RegistroAsistenciaDocente[];
}

export interface AdminAsistenciaDocenteItem {
  profesor: {
    id: number;
    nombre_completo: string;
    correo: string;
    DNI: string;
    materia?: string;
    nivel_educativo?: string;
  };
  registro: RegistroAsistenciaDocente | null;
  fecha: string;
  estado: 'PRESENTE' | 'AUSENTE_JUSTIFICADO' | 'AUSENTE_INJUSTIFICADO' | 'TARDE';
  motivo: string;
  observaciones: string;
  modificado_por_nombre: string | null;
  fecha_modificacion: string | null;
  existe_registro: boolean;
}

export interface ListarAsistenciasDocentesResponse {
  fecha: string;
  totalProfesores: number;
  docentes: AdminAsistenciaDocenteItem[];
}

export interface MiAsistenciaData {
  totalInasistencias: number;
  totalAsistenciasRegistradas: number;
  totalTardes: number;
  totalJustificados: number;
  totalSesiones: number;
  porcentajeAsistencia: number;
  estadoRegularidad: string;
  esRegular: boolean;
  periodoAcademico: string;
  registros: RegistroAsistenciaAlumno[];
  constancias: ConstanciaItem[];
}

export interface AlumnoRendimientoItem {
  alumno_id: number;
  nombre_completo: string;
  correo: string;
  DNI: string;
  curso: string;
  clase_id: number;
  clase_nombre: string;
  clase_seccion: string;
  totalSesiones: number;
  totalPresentes: number;
  totalAusentes: number;
  porcentajeAsistencia: number;
  estadoRegularidad: string;
  esRegular: boolean;
  promedioNotas: number | null;
  estadoAcademico: string;
  requiereSeguimiento: boolean;
}

export interface ClaseRendimientoItem {
  clase_id: number;
  nombre: string;
  materia: string;
  seccion: string;
  aula?: string;
  totalAlumnos: number;
  promedioGeneral: number | null;
  alumnosSatisfactorios: number;
  alumnosRequierenSeguimiento: number;
  tasaAprobacion: number;
  porcentajePresentismo: number;
  totalTrabajos: number;
}

const PLUGIN_BASE = `${API_URL}/plugins/edutech-preceptoria`;

/**
 * Cliente HTTP Seguro para Preceptoría
 * Blindado contra respuestas HTML o payloads inesperados que provocan SyntaxError.
 */
async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${PLUGIN_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      credentials: options.credentials || 'include',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  } catch (netErr: any) {
    console.error(`[PreceptoriaAPI] Error de conexión de red al llamar a ${url}:`, netErr);
    throw new Error('No se pudo establecer conexión con el servidor. Verifique que el backend esté en ejecución.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawText = await res.text();
    const isHtml = rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE');
    console.error(`[PreceptoriaAPI] Formato no JSON recibido de ${url} [HTTP ${res.status}]:`, rawText.slice(0, 200));

    if (res.status === 401) {
      throw new Error('Sesión no autenticada o expirada. Por favor inicie sesión nuevamente.');
    }
    if (res.status === 403) {
      throw new Error('Acceso no autorizado al recurso solicitado.');
    }
    if (res.status === 404) {
      throw new Error(`Endpoint de preceptoría no encontrado (${endpoint}). Verifique que el servicio esté habilitado.`);
    }
    if (isHtml) {
      throw new Error(`El servidor devolvió una página HTML en lugar de JSON (HTTP ${res.status}). Verifique la disponibilidad del backend.`);
    }
    throw new Error(`Respuesta no reconocida del servidor (HTTP ${res.status}).`);
  }

  let json: any;
  try {
    json = await res.json();
  } catch (jsonErr: any) {
    console.error(`[PreceptoriaAPI] Error al interpretar JSON de ${url}:`, jsonErr);
    throw new Error('La respuesta del servidor no pudo ser interpretada como JSON válido.');
  }

  if (!res.ok) {
    throw new Error(json.error || `Error en la operación del servidor (HTTP ${res.status})`);
  }

  return json;
}

export const PreceptoriaAPI = {
  async getHealth() {
    return apiRequest('/health');
  },

  async getMisClases(): Promise<ClasePreceptorOption[]> {
    const json = await apiRequest('/mis-clases');
    return json.data || [];
  },

  async getPlanillaFecha(claseId: number, fecha: string): Promise<PlanillaFechaData> {
    const json = await apiRequest(`/clases/${claseId}/planilla?fecha=${fecha}`);
    return json.data;
  },

  async guardarAsistencia(claseId: number, fecha: string, observaciones: string, registros: {
    alumnoId: number;
    estado: EstadoAsistencia;
    observacion?: string;
  }[]) {
    return apiRequest(`/clases/${claseId}/asistencia`, {
      method: 'POST',
      body: JSON.stringify({ fecha, observaciones, registros }),
    });
  },

  async getHistorial(claseId: number): Promise<HistorialSesionItem[]> {
    const json = await apiRequest(`/clases/${claseId}/historial`);
    return json.data || [];
  },

  async getEstadisticas(claseId: number): Promise<EstadisticasPreceptoria> {
    const json = await apiRequest(`/clases/${claseId}/estadisticas`);
    return json.data;
  },

  // Admin Endpoints
  async listarPreceptores(): Promise<PreceptorUsuarioItem[]> {
    const json = await apiRequest('/admin/preceptores');
    return json.data || [];
  },

  async asignarClase(preceptorId: number, claseId: number) {
    return apiRequest('/admin/asignar-clase', {
      method: 'POST',
      body: JSON.stringify({ preceptorId, claseId }),
    });
  },

  async revocarClase(preceptorId: number, claseId: number) {
    return apiRequest('/admin/revocar-clase', {
      method: 'POST',
      body: JSON.stringify({ preceptorId, claseId }),
    });
  },

  // ─── Métodos Alumnos ───
  async getMiAsistencia(): Promise<MiAsistenciaData> {
    const json = await apiRequest('/mi-asistencia');
    return json.data;
  },

  async solicitarConstancia(motivo: string, claseId?: number) {
    return apiRequest('/solicitar-constancia', {
      method: 'POST',
      body: JSON.stringify({ motivo, claseId }),
    });
  },

  // ─── Métodos Panel Preceptoría ───
  async getAlumnosRendimiento(claseId?: number, q?: string, curso?: string): Promise<AlumnoRendimientoItem[]> {
    const params = new URLSearchParams();
    if (claseId) params.append('claseId', String(claseId));
    if (q) params.append('q', q);
    if (curso) params.append('curso', curso);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const json = await apiRequest(`/panel/alumnos${qs}`);
    return json.data || [];
  },

  async getRendimientoClases(): Promise<ClaseRendimientoItem[]> {
    const json = await apiRequest('/panel/rendimiento-clases');
    return json.data || [];
  },

  async listarConstancias(): Promise<ConstanciaItem[]> {
    const json = await apiRequest('/constancias');
    return json.data || [];
  },

  async resolverConstancia(id: number, estado: 'APROBADA' | 'RECHAZADA', observaciones?: string) {
    return apiRequest(`/constancias/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado, observaciones }),
    });
  },

  async emitirConstanciaDirecta(alumnoId: number, motivo: string, observaciones?: string) {
    return apiRequest('/constancias/emitir-directa', {
      method: 'POST',
      body: JSON.stringify({ alumnoId, motivo, observaciones }),
    });
  },

  // ─── Métodos de Asistencia Laboral Docente ───
  async getMiAsistenciaDocente(): Promise<MiAsistenciaDocenteData> {
    const json = await apiRequest('/mi-asistencia-docente');
    return json.data;
  },

  async listarAsistenciasDocentes(fecha?: string, busqueda?: string): Promise<ListarAsistenciasDocentesResponse> {
    const params = new URLSearchParams();
    if (fecha) params.append('fecha', fecha);
    if (busqueda) params.append('busqueda', busqueda);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const json = await apiRequest(`/docentes/asistencias${qs}`);
    return json.data;
  },

  async guardarAsistenciaDocente(payload: {
    profesorId: number;
    fecha: string;
    estado: 'PRESENTE' | 'AUSENTE_JUSTIFICADO' | 'AUSENTE_INJUSTIFICADO' | 'TARDE';
    motivo?: string;
    observaciones?: string;
  }) {
    return apiRequest('/docentes/asistencias', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async eliminarAsistenciaDocente(id: number) {
    return apiRequest(`/docentes/asistencias/${id}`, {
      method: 'DELETE',
    });
  },
};

export default PreceptoriaAPI;

