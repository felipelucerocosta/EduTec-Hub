import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { useToast } from '../../contexts/ToastContext';
import { API_URL } from '../../config/api';

interface Clase {
  id: number;
  nombre: string;
  seccion?: string;
  materia: string;
  aula?: string;
  codigo: string;
  titular_id?: number;
  titular_nombre?: string;
  titular_correo?: string;
  cantidad_alumnos: number;
}

interface Profesor {
  id: number;
  nombre: string;
  correo: string;
  materia?: string;
  nivel_educativo?: string;
  clases_asignadas?: number;
}

interface Alumno {
  id: number;
  nombre: string;
  correo: string;
  DNI?: string;
  curso?: string;
  nivel_educativo?: string;
  clases_inscriptas?: number;
}

interface Preceptor {
  id: number;
  nombre: string;
  correo: string;
  DNI?: string;
  estado_acceso?: string;
  clases_asignadas: number;
  clases: Array<{
    id: number;
    nombre: string;
    materia: string;
    seccion?: string;
    codigo: string;
    aula?: string;
  }>;
}

const AdminAsignaciones: React.FC = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'clases' | 'preceptores'>('clases');
  const [clases, setClases] = useState<Clase[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [preceptores, setPreceptores] = useState<Preceptor[]>([]);
  const [loading, setLoading] = useState(true);

  // Clase seleccionada para gestionar sus asignaciones
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [alumnosClase, setAlumnosClase] = useState<Alumno[]>([]);
  const [loadingAlumnosClase, setLoadingAlumnosClase] = useState(false);

  // Form states (Clase -> Profesor/Alumnos)
  const [selectedProfesorId, setSelectedProfesorId] = useState<string>('');
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Form states (Preceptor -> Clases)
  const [selectedPreceptorId, setSelectedPreceptorId] = useState<number | null>(null);
  const [preceptorClaseIds, setPreceptorClaseIds] = useState<number[]>([]);
  const [searchPreceptor, setSearchPreceptor] = useState('');
  const [searchClasePreceptor, setSearchClasePreceptor] = useState('');
  const [savingPreceptor, setSavingPreceptor] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [resClases, resProfs, resAlumnos, resPreceptores] = await Promise.all([
        fetch(`${API_URL}/admin/clases`, { credentials: 'include' }),
        fetch(`${API_URL}/admin/profesores`, { credentials: 'include' }),
        fetch(`${API_URL}/admin/alumnos`, { credentials: 'include' }),
        fetch(`${API_URL}/admin/preceptores`, { credentials: 'include' }),
      ]);

      if (resClases.ok) {
        const dataClases = await resClases.json();
        setClases(dataClases);
        if (dataClases.length > 0 && selectedClaseId === null) {
          setSelectedClaseId(dataClases[0].id);
        }
      }
      if (resProfs.ok) setProfesores(await resProfs.json());
      if (resAlumnos.ok) setAlumnos(await resAlumnos.json());
      if (resPreceptores.ok) {
        const dataPreceptores: Preceptor[] = await resPreceptores.json();
        setPreceptores(dataPreceptores);
        if (dataPreceptores.length > 0 && selectedPreceptorId === null) {
          setSelectedPreceptorId(dataPreceptores[0].id);
          setPreceptorClaseIds(dataPreceptores[0].clases.map(c => c.id));
        }
      }
    } catch {
      showToast('Error al cargar datos de asignaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClaseId, selectedPreceptorId, showToast]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Sincronizar clases seleccionadas cuando cambia el preceptor activo
  useEffect(() => {
    if (selectedPreceptorId) {
      const prec = preceptores.find(p => p.id === selectedPreceptorId);
      if (prec) {
        setPreceptorClaseIds(prec.clases.map(c => c.id));
      }
    }
  }, [selectedPreceptorId, preceptores]);

  const fetchAlumnosDeClase = useCallback(async (claseId: number) => {
    setLoadingAlumnosClase(true);
    try {
      const res = await fetch(`${API_URL}/admin/clases/${claseId}/alumnos`, { credentials: 'include' });
      if (res.ok) {
        setAlumnosClase(await res.json());
      }
    } catch {
      showToast('Error al cargar alumnos de la clase', 'error');
    } finally {
      setLoadingAlumnosClase(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedClaseId) {
      fetchAlumnosDeClase(selectedClaseId);
      const claseActual = clases.find(c => c.id === selectedClaseId);
      if (claseActual) {
        setSelectedProfesorId(claseActual.titular_id ? String(claseActual.titular_id) : '');
      }
    }
  }, [selectedClaseId, clases, fetchAlumnosDeClase]);

  const handleUpdateProfesor = async () => {
    if (!selectedClaseId) return;
    setSaving(true);
    try {
      if (!selectedProfesorId) {
        // Remover titular
        const res = await fetch(`${API_URL}/admin/clases/${selectedClaseId}/asignar-profesor`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          showToast('Titular removido correctamente', 'success');
          fetchInitialData();
        }
      } else {
        const res = await fetch(`${API_URL}/admin/clases/${selectedClaseId}/asignar-profesor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ profesor_id: Number(selectedProfesorId) }),
        });
        if (res.ok) {
          const data = await res.json();
          showToast(data.message || 'Profesor asignado', 'success');
          fetchInitialData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Error al asignar', 'error');
        }
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAlumno = async () => {
    if (!selectedClaseId || !selectedAlumnoId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/clases/${selectedClaseId}/asignar-alumno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ alumno_id: Number(selectedAlumnoId) }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Alumno inscripto', 'success');
        setSelectedAlumnoId('');
        fetchAlumnosDeClase(selectedClaseId);
        fetchInitialData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al inscribir alumno', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAlumno = async (alumnoId: number) => {
    if (!selectedClaseId) return;
    try {
      const res = await fetch(`${API_URL}/admin/clases/${selectedClaseId}/alumnos/${alumnoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        showToast('Alumno desinscripto', 'success');
        fetchAlumnosDeClase(selectedClaseId);
        fetchInitialData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

  const handleToggleClasePreceptor = (claseId: number) => {
    setPreceptorClaseIds(prev =>
      prev.includes(claseId) ? prev.filter(id => id !== claseId) : [...prev, claseId]
    );
  };

  const handleSelectAllClases = () => {
    setPreceptorClaseIds(clases.map(c => c.id));
  };

  const handleClearAllClases = () => {
    setPreceptorClaseIds([]);
  };

  const handleSavePreceptorClases = async () => {
    if (!selectedPreceptorId) return;
    setSavingPreceptor(true);
    try {
      const res = await fetch(`${API_URL}/admin/preceptores/${selectedPreceptorId}/clases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clase_ids: preceptorClaseIds }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Asignaciones guardadas con éxito', 'success');
        await fetchInitialData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar asignaciones', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSavingPreceptor(false);
    }
  };

  const handleRemovePreceptorClase = async (claseId: number) => {
    if (!selectedPreceptorId) return;
    try {
      const res = await fetch(`${API_URL}/admin/preceptores/${selectedPreceptorId}/clases/${claseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        showToast('Comisión desasignada del preceptor', 'success');
        setPreceptorClaseIds(prev => prev.filter(id => id !== claseId));
        await fetchInitialData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al desasignar', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

  const selectedClase = clases.find(c => c.id === selectedClaseId);
  const alumnosNoInscriptos = alumnos.filter(a => !alumnosClase.some(ac => ac.id === a.id));

  const selectedPreceptor = preceptores.find(p => p.id === selectedPreceptorId);
  const filteredPreceptores = preceptores.filter(p =>
    p.nombre.toLowerCase().includes(searchPreceptor.toLowerCase()) ||
    p.correo.toLowerCase().includes(searchPreceptor.toLowerCase()) ||
    (p.DNI && p.DNI.includes(searchPreceptor))
  );

  const filteredClasesForPreceptor = clases.filter(c =>
    c.nombre.toLowerCase().includes(searchClasePreceptor.toLowerCase()) ||
    c.materia.toLowerCase().includes(searchClasePreceptor.toLowerCase()) ||
    (c.seccion && c.seccion.toLowerCase().includes(searchClasePreceptor.toLowerCase())) ||
    c.codigo.toLowerCase().includes(searchClasePreceptor.toLowerCase())
  );

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <i className="bx bx-transfer" style={{ color: '#38bdf8' }}></i> Asignaciones Académicas
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.3rem' }}>
            Gestiona la asignación de profesores titulares, estudiantes matriculados y preceptores a cargo de cada comisión
          </p>
        </div>

        {/* Selector de Pestañas (Tabs) */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setTab('clases')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: tab === 'clases' ? '1px solid rgba(56,189,248,0.4)' : '1px solid transparent',
              background: tab === 'clases' ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: tab === 'clases' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="bx bx-book-bookmark" style={{ fontSize: '1.15rem' }}></i>
            Docentes y Alumnos por Clase
          </button>

          <button
            onClick={() => setTab('preceptores')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: tab === 'preceptores' ? '1px solid rgba(56,189,248,0.4)' : '1px solid transparent',
              background: tab === 'preceptores' ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: tab === 'preceptores' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="bx bx-id-card" style={{ fontSize: '1.15rem' }}></i>
            Asignación de Preceptoría
            <span style={{
              background: 'rgba(56,189,248,0.25)',
              color: '#7dd3fc',
              padding: '0.1rem 0.45rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              {preceptores.length}
            </span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Cargando asignaciones académicas...</p>
          </div>
        ) : tab === 'clases' ? (
          clases.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(15,23,42,0.6)', borderRadius: '16px', color: '#64748b' }}>
            No hay clases creadas. Primero crea una clase en la sección Clases.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Sidebar de Clases */}
            <div style={{
              background: 'rgba(15,23,42,0.7)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                Seleccionar Clase
              </div>
              {clases.map(c => {
                const isSelected = c.id === selectedClaseId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClaseId(c.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.04)',
                      color: '#f8fafc',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                      {c.nombre}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {c.materia} · #{c.codigo}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isSelected ? '#7dd3fc' : '#64748b', marginTop: '0.2rem' }}>
                      {c.titular_nombre ? `Prof. ${c.titular_nombre}` : 'Sin profesor'} · {c.cantidad_alumnos} alumnos
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Panel de Gestión de la Clase Seleccionada */}
            {selectedClase && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Info Card Clase */}
                <div style={{
                  background: 'rgba(15,23,42,0.8)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Clase Activa
                    </span>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: '0.2rem 0' }}>
                      {selectedClase.nombre}
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                      Materia: <strong>{selectedClase.materia}</strong> · Aula: {selectedClase.aula || 'N/A'} · Código: <strong style={{ color: '#38bdf8' }}>{selectedClase.codigo}</strong>
                    </p>
                  </div>
                </div>

                {/* Sección 1: Profesor Titular */}
                <div style={{
                  background: 'rgba(15,23,42,0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bx bx-user-check" style={{ color: '#38bdf8', fontSize: '1.3rem' }}></i>
                    <h3 style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                      Profesor Titular Asignado
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={selectedProfesorId}
                      onChange={e => setSelectedProfesorId(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: '220px',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: 'rgba(30,41,59,0.9)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255,255,255,0.12)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="">— Ninguno (Sin profesor) —</option>
                      {profesores.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.correo}){p.nivel_educativo ? ` [${p.nivel_educativo}]` : ''} {p.materia ? `- ${p.materia}` : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleUpdateProfesor}
                      disabled={saving}
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.88rem'
                      }}
                    >
                      <i className="bx bx-save"></i> {saving ? 'Guardando...' : 'Guardar Titular'}
                    </button>
                  </div>
                </div>

                {/* Sección 2: Alumnos Inscriptos */}
                <div style={{
                  background: 'rgba(15,23,42,0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="bx bx-group" style={{ color: '#a78bfa', fontSize: '1.3rem' }}></i>
                      <h3 style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                        Alumnos Inscriptos ({alumnosClase.length})
                      </h3>
                    </div>
                  </div>

                  {/* Form Agregar Alumno */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <select
                      value={selectedAlumnoId}
                      onChange={e => setSelectedAlumnoId(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: '220px',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: 'rgba(30,41,59,0.9)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255,255,255,0.12)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="">— Seleccionar alumno para inscribir —</option>
                      {alumnosNoInscriptos.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.nombre} ({a.correo}){a.nivel_educativo ? ` [${a.nivel_educativo}]` : ''} {a.curso ? `- ${a.curso}` : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAddAlumno}
                      disabled={!selectedAlumnoId || saving}
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        background: !selectedAlumnoId ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: selectedAlumnoId ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.88rem'
                      }}
                    >
                      <i className="bx bx-plus-circle"></i> Inscribir Alumno
                    </button>
                  </div>

                  {/* Tabla de Alumnos Inscriptos */}
                  {loadingAlumnosClase ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      <i className="bx bx-loader-alt bx-spin"></i> Cargando alumnos...
                    </div>
                  ) : alumnosClase.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                      No hay alumnos inscriptos en esta clase todavía.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Alumno</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Correo</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>DNI</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alumnosClase.map(a => (
                            <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '0.75rem 1rem', color: '#f8fafc', fontWeight: 600, fontSize: '0.88rem' }}>
                                {a.nombre}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                                {a.correo}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                                {a.DNI || '—'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleRemoveAlumno(a.id)}
                                  style={{
                                    padding: '0.35rem 0.7rem',
                                    borderRadius: '8px',
                                    background: 'rgba(244,63,94,0.1)',
                                    border: '1px solid rgba(244,63,94,0.25)',
                                    color: '#fb7185',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    fontWeight: 600
                                  }}
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
          /* ─── TAB 2: ASIGNACIÓN DE PRECEPTORÍA ─────────────────────────────────── */
          preceptores.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(15,23,42,0.6)', borderRadius: '16px', color: '#64748b' }}>
              <i className="bx bx-user-x" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'block', color: '#94a3b8' }}></i>
              No hay usuarios registrados con rol de Preceptor. Crea una cuenta con rol 'Preceptor' en la sección de Usuarios.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
              {/* Sidebar de Preceptores */}
              <div style={{
                background: 'rgba(15,23,42,0.7)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: 'calc(100vh - 250px)',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', padding: '0.25rem 0.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  Nómina de Preceptores ({preceptores.length})
                </div>

                {/* Buscador de Preceptor */}
                <div style={{ position: 'relative' }}>
                  <i className="bx bx-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}></i>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, correo o DNI..."
                    value={searchPreceptor}
                    onChange={e => setSearchPreceptor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                      borderRadius: '8px',
                      background: 'rgba(30,41,59,0.8)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#f8fafc',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {filteredPreceptores.map(p => {
                    const isSelected = p.id === selectedPreceptorId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPreceptorId(p.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.04)',
                          color: '#f8fafc',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                            {p.nombre}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '999px',
                            background: p.clases.length > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.15)',
                            color: p.clases.length > 0 ? '#34d399' : '#facc15',
                            fontWeight: 700
                          }}>
                            {p.clases.length} {p.clases.length === 1 ? 'clase' : 'clases'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {p.correo}
                        </div>
                        {p.DNI && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            DNI: {p.DNI}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Panel de Gestión del Preceptor Seleccionado */}
              {selectedPreceptor && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Tarjeta de Información del Preceptor */}
                  <div style={{
                    background: 'rgba(15,23,42,0.8)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Preceptor Seleccionado
                      </span>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: '0.2rem 0' }}>
                        {selectedPreceptor.nombre}
                      </h2>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                        Correo: <strong>{selectedPreceptor.correo}</strong> {selectedPreceptor.DNI ? `· DNI: ${selectedPreceptor.DNI}` : ''} · ID: #{selectedPreceptor.id}
                      </p>
                    </div>

                    <button
                      onClick={handleSavePreceptorClases}
                      disabled={savingPreceptor}
                      style={{
                        padding: '0.75rem 1.4rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 12px rgba(14,165,233,0.3)'
                      }}
                    >
                      <i className={`bx ${savingPreceptor ? 'bx-loader-alt bx-spin' : 'bx-save'}`}></i>
                      {savingPreceptor ? 'Guardando Asignaciones...' : 'Guardar Asignaciones'}
                    </button>
                  </div>

                  {/* Sección de Comisiones Asignadas Actualmente (Chips) */}
                  <div style={{
                    background: 'rgba(15,23,42,0.7)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <i className="bx bx-check-shield" style={{ color: '#38bdf8' }}></i>
                        Comisiones a Cargo Actualmente ({selectedPreceptor.clases.length})
                      </h3>
                    </div>

                    {selectedPreceptor.clases.length === 0 ? (
                      <p style={{ margin: 0, color: '#eab308', fontSize: '0.85rem' }}>
                        Este preceptor aún no tiene comisiones asignadas. Marca las clases correspondientes abajo y presiona "Guardar Asignaciones".
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {selectedPreceptor.clases.map(c => (
                          <div
                            key={c.id}
                            style={{
                              background: 'rgba(56,189,248,0.1)',
                              border: '1px solid rgba(56,189,248,0.3)',
                              borderRadius: '8px',
                              padding: '0.35rem 0.7rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.84rem',
                              color: '#f8fafc'
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{c.nombre} {c.seccion ? `(${c.seccion})` : ''}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{c.materia}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePreceptorClase(c.id)}
                              title="Desasignar clase inmediatamente"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#fb7185',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                lineHeight: 1,
                                padding: '0 2px'
                              }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sección de Selección Múltiple de Clases */}
                  <div style={{
                    background: 'rgba(15,23,42,0.7)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                          Catálogo de Comisiones Institucionales
                        </h3>
                        <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                          Marca las casillas de las comisiones que este preceptor debe fiscalizar y tomar asistencia diaria.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={handleSelectAllClases}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e2e8f0',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Seleccionar Todas
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllClases}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e2e8f0',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Limpiar Selección
                        </button>
                      </div>
                    </div>

                    {/* Filtro de clases */}
                    <div style={{ position: 'relative' }}>
                      <i className="bx bx-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}></i>
                      <input
                        type="text"
                        placeholder="Filtrar comisiones por nombre, materia o código..."
                        value={searchClasePreceptor}
                        onChange={e => setSearchClasePreceptor(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem 0.6rem 2.2rem',
                          borderRadius: '8px',
                          background: 'rgba(30,41,59,0.8)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#f8fafc',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Grid de Checkboxes de Clases */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '0.75rem',
                      maxHeight: '380px',
                      overflowY: 'auto',
                      paddingRight: '0.25rem'
                    }}>
                      {filteredClasesForPreceptor.map(c => {
                        const isChecked = preceptorClaseIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleToggleClasePreceptor(c.id)}
                            style={{
                              background: isChecked ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.02)',
                              border: isChecked ? '1px solid rgba(56,189,248,0.45)' : '1px solid rgba(255,255,255,0.06)',
                              borderRadius: '10px',
                              padding: '0.85rem',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // controlado por el onClick del contenedor
                              style={{
                                marginTop: '0.25rem',
                                width: '16px',
                                height: '16px',
                                accentColor: '#0ea5e9',
                                cursor: 'pointer'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isChecked ? '#38bdf8' : '#f8fafc' }}>
                                {c.nombre} {c.seccion ? `(${c.seccion})` : ''}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                                {c.materia} · #{c.codigo}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {c.titular_nombre ? `Prof. ${c.titular_nombre}` : 'Sin profesor'} · {c.cantidad_alumnos} alumnos
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Resumen y botón de guardar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      paddingTop: '1rem',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Seleccionadas: <strong style={{ color: '#38bdf8' }}>{preceptorClaseIds.length}</strong> de {clases.length} comisiones
                      </div>
                      <button
                        onClick={handleSavePreceptorClases}
                        disabled={savingPreceptor}
                        style={{
                          padding: '0.65rem 1.4rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.88rem'
                        }}
                      >
                        <i className={`bx ${savingPreceptor ? 'bx-loader-alt bx-spin' : 'bx-save'}`}></i>
                        {savingPreceptor ? 'Guardando...' : 'Guardar Asignaciones'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAsignaciones;
