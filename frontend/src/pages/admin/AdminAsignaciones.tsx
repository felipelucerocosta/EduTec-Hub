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
  clases_asignadas?: number;
}

interface Alumno {
  id: number;
  nombre: string;
  correo: string;
  DNI?: string;
  curso?: string;
  clases_inscriptas?: number;
}

const AdminAsignaciones: React.FC = () => {
  const { showToast } = useToast();
  const [clases, setClases] = useState<Clase[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);

  // Clase seleccionada para gestionar sus asignaciones
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [alumnosClase, setAlumnosClase] = useState<Alumno[]>([]);
  const [loadingAlumnosClase, setLoadingAlumnosClase] = useState(false);

  // Form states
  const [selectedProfesorId, setSelectedProfesorId] = useState<string>('');
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [resClases, resProfs, resAlumnos] = await Promise.all([
        fetch(`${API_URL}/admin/clases`, { credentials: 'include' }),
        fetch(`${API_URL}/admin/profesores`, { credentials: 'include' }),
        fetch(`${API_URL}/admin/alumnos`, { credentials: 'include' }),
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
    } catch {
      showToast('Error al cargar datos de asignaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClaseId, showToast]);

  useEffect(() => {
    fetchInitialData();
  }, []);

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

  const selectedClase = clases.find(c => c.id === selectedClaseId);
  const alumnosNoInscriptos = alumnos.filter(a => !alumnosClase.some(ac => ac.id === a.id));

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <i className="bx bx-transfer" style={{ color: '#38bdf8' }}></i> Asignaciones Académicas
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.3rem' }}>
            Vincula profesores titulares y alumnos a cada clase o comisión del campus virtual
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
          </div>
        ) : clases.length === 0 ? (
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
                          {p.nombre} ({p.correo}) {p.materia ? `- ${p.materia}` : ''}
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
                          {a.nombre} ({a.correo}) {a.curso ? `- ${a.curso}` : ''}
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
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAsignaciones;
