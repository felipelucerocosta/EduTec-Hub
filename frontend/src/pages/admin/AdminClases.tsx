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
  total_trabajos: number;
}

interface Alumno { id: number; nombre: string; correo: string; }
interface Profesor { id: number; nombre: string; correo: string; materia?: string; }

const AdminClases: React.FC = () => {
  const { showToast } = useToast();
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [alumnosClase, setAlumnosClase] = useState<{ [claseId: number]: Alumno[] }>({});
  const [expandedClaseId, setExpandedClaseId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAsignarProfeModal, setShowAsignarProfeModal] = useState<Clase | null>(null);
  const [showAsignarAlumnoModal, setShowAsignarAlumnoModal] = useState<Clase | null>(null);
  const [confirmDeleteClase, setConfirmDeleteClase] = useState<Clase | null>(null);
  const [confirmDeleteAlumno, setConfirmDeleteAlumno] = useState<{ clase: Clase; alumno: Alumno } | null>(null);

  // Forms
  const [newClase, setNewClase] = useState({ nombre: '', seccion: '', materia: '', aula: '', titular_id: '' });
  const [selectedProfeId, setSelectedProfeId] = useState<string>('');
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resClases, resProfs, resAlumnos] = await Promise.all([
        fetch(`${API_URL}/admin/clases`, { credentials: 'include' }),
        fetch(`${API_URL}/admin/profesores`, { credentials: 'include' }),
        fetch(`${API_URL}/admin/alumnos`, { credentials: 'include' }),
      ]);
      if (resClases.ok) setClases(await resClases.json());
      if (resProfs.ok) setProfesores(await resProfs.json());
      if (resAlumnos.ok) setAlumnos(await resAlumnos.json());
    } catch { showToast('Error al cargar datos', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchAlumnosClase = async (claseId: number) => {
    try {
      const res = await fetch(`${API_URL}/admin/clases/${claseId}/alumnos`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAlumnosClase(prev => ({ ...prev, [claseId]: data }));
      }
    } catch { /* silent */ }
  };

  const toggleExpand = async (id: number) => {
    if (expandedClaseId === id) { setExpandedClaseId(null); return; }
    setExpandedClaseId(id);
    if (!alumnosClase[id]) await fetchAlumnosClase(id);
  };

  const handleCreateClase = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/clases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...newClase, titular_id: newClase.titular_id ? Number(newClase.titular_id) : undefined }),
      });
      if (res.ok) {
        showToast('Clase creada', 'success');
        setShowCreateModal(false);
        setNewClase({ nombre: '', seccion: '', materia: '', aula: '', titular_id: '' });
        fetchAll();
      } else { const err = await res.json(); showToast(err.error || 'Error al crear clase', 'error'); }
    } catch { showToast('Error de conexión', 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteClase = async () => {
    if (!confirmDeleteClase) return;
    try {
      const res = await fetch(`${API_URL}/admin/clases/${confirmDeleteClase.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { showToast('Clase eliminada', 'success'); setConfirmDeleteClase(null); fetchAll(); }
      else { const err = await res.json(); showToast(err.error || 'Error', 'error'); }
    } catch { showToast('Error de conexión', 'error'); }
  };

  const handleAsignarProfe = async () => {
    if (!showAsignarProfeModal || !selectedProfeId) return; setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/clases/${showAsignarProfeModal.id}/asignar-profesor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ profesor_id: Number(selectedProfeId) }),
      });
      if (res.ok) {
        const data = await res.json(); showToast(data.message, 'success');
        setShowAsignarProfeModal(null); setSelectedProfeId(''); fetchAll();
      } else { const err = await res.json(); showToast(err.error || 'Error', 'error'); }
    } catch { showToast('Error de conexión', 'error'); }
    finally { setSaving(false); }
  };

  const handleAsignarAlumno = async () => {
    if (!showAsignarAlumnoModal || !selectedAlumnoId) return; setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/clases/${showAsignarAlumnoModal.id}/asignar-alumno`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ alumno_id: Number(selectedAlumnoId) }),
      });
      if (res.ok) {
        const data = await res.json(); showToast(data.message, 'success');
        setShowAsignarAlumnoModal(null); setSelectedAlumnoId('');
        fetchAlumnosClase(showAsignarAlumnoModal.id); fetchAll();
      } else { const err = await res.json(); showToast(err.error || 'Error', 'error'); }
    } catch { showToast('Error de conexión', 'error'); }
    finally { setSaving(false); }
  };

  const handleRemoveAlumno = async () => {
    if (!confirmDeleteAlumno) return;
    try {
      const res = await fetch(`${API_URL}/admin/clases/${confirmDeleteAlumno.clase.id}/alumnos/${confirmDeleteAlumno.alumno.id}`, {
        method: 'DELETE', credentials: 'include'
      });
      if (res.ok) {
        showToast('Alumno desinscripto', 'success'); setConfirmDeleteAlumno(null);
        fetchAlumnosClase(confirmDeleteAlumno.clase.id); fetchAll();
      } else { const err = await res.json(); showToast(err.error || 'Error', 'error'); }
    } catch { showToast('Error de conexión', 'error'); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem', borderRadius: '10px',
    background: 'rgba(30,41,59,0.9)', color: '#f8fafc',
    border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.9rem', boxSizing: 'border-box',
  };

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem',
  };

  const modalBox: React.CSSProperties = {
    background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
    width: '100%', maxWidth: '480px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="bx bx-chalkboard" style={{ color: '#10b981' }}></i> Clases
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.3rem' }}>
              {clases.length} clase{clases.length !== 1 ? 's' : ''} · Crear, asignar profesor y gestionar alumnos
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.25rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
          >
            <i className="bx bx-plus" style={{ fontSize: '1.1rem' }}></i> Nueva Clase
          </button>
        </div>

        {/* Clases List */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
          </div>
        ) : clases.length === 0 ? (
          <div style={{
            padding: '4rem', textAlign: 'center',
            background: 'rgba(15,23,42,0.6)', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <i className="bx bx-book-open" style={{ fontSize: '3rem', color: '#334155', display: 'block', marginBottom: '1rem' }}></i>
            <p style={{ color: '#64748b', margin: 0 }}>No hay clases. ¡Crea la primera!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {clases.map(clase => (
              <div key={clase.id} style={{
                background: 'rgba(15,23,42,0.7)', borderRadius: '16px',
                border: expandedClaseId === clase.id ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.07)',
                overflow: 'hidden', transition: 'border-color 0.2s',
              }}>
                {/* Row Header */}
                <div style={{ padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px',
                      background: 'rgba(16,185,129,0.15)', color: '#34d399',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0,
                    }}>
                      <i className="bx bx-book"></i>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {clase.nombre}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {clase.materia} · {clase.aula || 'Sin aula'} · Código: <strong style={{ color: '#38bdf8' }}>{clase.codigo}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Titular badge */}
                    {clase.titular_nombre ? (
                      <span style={{
                        padding: '0.25rem 0.7rem', borderRadius: '999px',
                        background: 'rgba(56,189,248,0.1)', color: '#38bdf8',
                        border: '1px solid rgba(56,189,248,0.25)', fontSize: '0.75rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                      }}>
                        <i className="bx bx-user"></i> {clase.titular_nombre}
                      </span>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.7rem', borderRadius: '999px',
                        background: 'rgba(245,158,11,0.1)', color: '#fbbf24',
                        border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        Sin profesor
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {clase.cantidad_alumnos} alumnos · {clase.total_trabajos} trabajos
                    </span>

                    {/* Action Buttons */}
                    <button onClick={() => { setShowAsignarProfeModal(clase); setSelectedProfeId(String(clase.titular_id || '')); }}
                      style={{ padding: '0.35rem 0.65rem', borderRadius: '7px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                      <i className="bx bx-user-check"></i> Profesor
                    </button>
                    <button onClick={() => { setShowAsignarAlumnoModal(clase); setSelectedAlumnoId(''); }}
                      style={{ padding: '0.35rem 0.65rem', borderRadius: '7px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                      <i className="bx bx-user-plus"></i> Alumno
                    </button>
                    <button onClick={() => toggleExpand(clase.id)}
                      style={{ padding: '0.35rem 0.65rem', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem' }}>
                      <i className={`bx ${expandedClaseId === clase.id ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                    </button>
                    <button onClick={() => setConfirmDeleteClase(clase)}
                      style={{ padding: '0.35rem 0.65rem', borderRadius: '7px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', cursor: 'pointer', fontSize: '0.78rem' }}>
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </div>

                {/* Expanded: List of enrolled students */}
                {expandedClaseId === clase.id && (
                  <div style={{ padding: '0 1.5rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.75rem 0 0.5rem', fontWeight: 600 }}>
                      Alumnos inscriptos ({alumnosClase[clase.id]?.length || 0}):
                    </p>
                    {!alumnosClase[clase.id] ? (
                      <div style={{ color: '#64748b', fontSize: '0.82rem' }}><i className="bx bx-loader-alt bx-spin"></i> Cargando...</div>
                    ) : alumnosClase[clase.id].length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '0.82rem' }}>No hay alumnos inscriptos.</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {alumnosClase[clase.id].map(alumno => (
                          <div key={alumno.id} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.35rem 0.75rem', borderRadius: '999px',
                            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                          }}>
                            <span style={{ color: '#c4b5fd', fontSize: '0.8rem', fontWeight: 600 }}>{alumno.nombre}</span>
                            <button onClick={() => setConfirmDeleteAlumno({ clase, alumno })}
                              style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '0', lineHeight: 1, fontSize: '0.9rem' }}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Crear Clase */}
      {showCreateModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f8fafc', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bx bx-plus-circle" style={{ color: '#10b981' }}></i> Crear Clase
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <form onSubmit={handleCreateClase} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Nombre *</label>
                  <input required style={inputStyle} value={newClase.nombre} onChange={e => setNewClase(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Matemática 3A" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Materia *</label>
                  <input required style={inputStyle} value={newClase.materia} onChange={e => setNewClase(f => ({ ...f, materia: e.target.value }))} placeholder="Ej: Matemática" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Sección</label>
                  <input style={inputStyle} value={newClase.seccion} onChange={e => setNewClase(f => ({ ...f, seccion: e.target.value }))} placeholder="Ej: 3ro A" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Aula</label>
                  <input style={inputStyle} value={newClase.aula} onChange={e => setNewClase(f => ({ ...f, aula: e.target.value }))} placeholder="Ej: Laboratorio 1" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Asignar Profesor (opcional)</label>
                <select style={inputStyle} value={newClase.titular_id} onChange={e => setNewClase(f => ({ ...f, titular_id: e.target.value }))}>
                  <option value="">— Sin titular —</option>
                  {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.correo})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '0.65rem 1.4rem', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {saving ? <><i className="bx bx-loader-alt bx-spin"></i> Creando...</> : <><i className="bx bx-check"></i> Crear</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Asignar Profesor */}
      {showAsignarProfeModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f8fafc', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bx bx-user-check" style={{ color: '#38bdf8' }}></i> Asignar Profesor
              </h3>
              <button onClick={() => setShowAsignarProfeModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Clase: <strong style={{ color: '#f8fafc' }}>{showAsignarProfeModal.nombre}</strong>
            </p>
            <select style={inputStyle} value={selectedProfeId} onChange={e => setSelectedProfeId(e.target.value)}>
              <option value="">— Seleccionar profesor —</option>
              {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.materia ? `(${p.materia})` : ''}</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowAsignarProfeModal(null)} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleAsignarProfe} disabled={!selectedProfeId || saving} style={{ padding: '0.65rem 1.4rem', borderRadius: '10px', background: !selectedProfeId ? 'rgba(56,189,248,0.3)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)', border: 'none', color: '#fff', fontWeight: 700, cursor: selectedProfeId ? 'pointer' : 'not-allowed' }}>
                {saving ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Asignar Alumno */}
      {showAsignarAlumnoModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f8fafc', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bx bx-user-plus" style={{ color: '#a78bfa' }}></i> Inscribir Alumno
              </h3>
              <button onClick={() => setShowAsignarAlumnoModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Clase: <strong style={{ color: '#f8fafc' }}>{showAsignarAlumnoModal.nombre}</strong>
            </p>
            <select style={inputStyle} value={selectedAlumnoId} onChange={e => setSelectedAlumnoId(e.target.value)}>
              <option value="">— Seleccionar alumno —</option>
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.correo})</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowAsignarAlumnoModal(null)} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleAsignarAlumno} disabled={!selectedAlumnoId || saving} style={{ padding: '0.65rem 1.4rem', borderRadius: '10px', background: !selectedAlumnoId ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', color: '#fff', fontWeight: 700, cursor: selectedAlumnoId ? 'pointer' : 'not-allowed' }}>
                {saving ? 'Inscribiendo...' : 'Inscribir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Clase */}
      {confirmDeleteClase && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>🗑️</div>
            <div>
              <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem', fontWeight: 800 }}>Eliminar Clase</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                ¿Eliminar <strong style={{ color: '#f8fafc' }}>{confirmDeleteClase.nombre}</strong>?
                Se borrarán trabajos, entregas y materiales asociados.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDeleteClase(null)} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleDeleteClase} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Alumno */}
      {confirmDeleteAlumno && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>👤</div>
            <div>
              <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem', fontWeight: 800 }}>Desinscribir Alumno</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                ¿Quitar a <strong style={{ color: '#f8fafc' }}>{confirmDeleteAlumno.alumno.nombre}</strong> de la clase <strong style={{ color: '#f8fafc' }}>{confirmDeleteAlumno.clase.nombre}</strong>?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDeleteAlumno(null)} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleRemoveAlumno} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Desinscribir</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminClases;
