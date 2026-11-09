import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components reutilizables/Button';
import { useToast } from '../contexts/ToastContext';
import { API_URL, BACKEND_URL } from '../config/api';

const TrabajoProfesorPage: React.FC = () => {
  const { claseId, trabajoId } = useParams<{ claseId: string; trabajoId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [trabajo, setTrabajo] = useState<any>(null);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [calificacionInput, setCalificacionInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [showConsigna, setShowConsigna] = useState(true);

  useEffect(() => {
    if (!trabajoId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [resTrabajo, resEntregas] = await Promise.all([
          fetch(`${API_URL}/trabajos/${trabajoId}`, { credentials: 'include' }),
          fetch(`${API_URL}/trabajos/${trabajoId}/entregas`, { credentials: 'include' })
        ]);

        if (resTrabajo.ok) {
          const tData = await resTrabajo.json();
          setTrabajo(tData);
        }
        if (resEntregas.ok) {
          const eData = await resEntregas.json();
          setEntregas(Array.isArray(eData) ? eData : []);
        }
      } catch (err) {
        console.error('Error al cargar datos del trabajo:', err);
        showToast('Error de conexión', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trabajoId, showToast]);

  const handleOpenGradeModal = (index: number) => {
    const entrega = entregas[index];
    if (!entrega) return;
    setEditingIndex(index);
    setCalificacionInput(entrega.calificacion !== null && entrega.calificacion !== undefined ? String(entrega.calificacion) : '');
    setFeedbackInput(entrega.feedback || '');
  };

  const currentEditingEntrega = editingIndex !== null ? entregas[editingIndex] : null;

  const handleNavigateStudent = (direction: 'prev' | 'next') => {
    if (editingIndex === null) return;
    const newIdx = direction === 'prev' ? editingIndex - 1 : editingIndex + 1;
    if (newIdx >= 0 && newIdx < entregas.length) {
      handleOpenGradeModal(newIdx);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditingEntrega) return;

    const nota = parseFloat(calificacionInput);
    const maxPts = trabajo?.puntos_max || 20;
    if (isNaN(nota) || nota < 0 || nota > maxPts) {
      showToast(`Ingresa una calificación válida (0 a ${maxPts})`, 'error');
      return;
    }

    setSavingGrade(true);
    try {
      const endpoint = currentEditingEntrega.id || currentEditingEntrega.entrega_id
        ? `${API_URL}/entregas/${currentEditingEntrega.id || currentEditingEntrega.entrega_id}/calificar`
        : `${API_URL}/trabajos/${trabajoId}/alumnos/${currentEditingEntrega.alumno_id}/calificar`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ calificacion: nota, feedback: feedbackInput })
      });

      if (res.ok) {
        showToast('¡Calificación guardada con éxito!', 'success');
        // Re-fetch latest roster and submissions from database
        const resEntregas = await fetch(`${API_URL}/trabajos/${trabajoId}/entregas`, { credentials: 'include' });
        if (resEntregas.ok) {
          const eData = await resEntregas.json();
          setEntregas(Array.isArray(eData) ? eData : []);
        }
        setEditingIndex(null);
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar la calificación', 'error');
      }
    } catch (err) {
      console.error('Error grading:', err);
      showToast('Error al conectar con el servidor', 'error');
    } finally {
      setSavingGrade(false);
    }
  };

  const totalAlumnos = entregas.length;
  const entregadosCount = entregas.filter((e) => e.estado && e.estado !== 'sin_entregar').length;
  const calificadosCount = entregas.filter((e) => e.estado === 'corregido' && e.calificacion !== null && e.calificacion !== undefined).length;
  const promedios = entregas
    .filter((e) => e.calificacion !== null && e.calificacion !== undefined)
    .map((e) => Number(e.calificacion));

  const promedioCalculado = promedios.length > 0
    ? Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 10) / 10
    : '—';

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(claseId ? `/gestionClase/${claseId}` : '/clases')}
            style={{
              background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.5rem'
            }}
          >
            <i className="bx bx-arrow-back"></i> Volver a la clase
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bx bx-task" style={{ color: '#7c3aed' }}></i> {trabajo?.titulo || 'Detalle del Trabajo (Profesor)'}
              </h1>
              {trabajo && (
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  Fecha límite: <strong style={{ color: '#cbd5e1' }}>{trabajo.fecha_limite ? new Date(trabajo.fecha_limite).toLocaleDateString() : 'Sin fecha'}</strong> — Puntaje Máximo: <strong style={{ color: '#38bdf8' }}>{trabajo.puntos_max || 20} pts</strong>
                </p>
              )}
            </div>

            <button
              onClick={() => setShowConsigna(!showConsigna)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
            >
              <i className={`bx ${showConsigna ? 'bx-hide' : 'bx-show'}`}></i> {showConsigna ? 'Ocultar Consigna' : 'Ver Consigna'}
            </button>
          </div>
        </div>

        {/* Consigna Card */}
        {trabajo && showConsigna && (
          <div style={{
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem' }}>
              <i className="bx bx-book-open"></i> Consigna e Instrucciones del Trabajo
            </div>
            {trabajo.descripcion && (
              <p style={{ color: '#e2e8f0', fontSize: '0.92rem', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {trabajo.descripcion}
              </p>
            )}
            {trabajo.instrucciones && (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                <strong style={{ color: '#c4b5fd' }}>Pautas:</strong> {trabajo.instrucciones}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.3)', padding: '1.25rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total de Entregas</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
                  {entregadosCount} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 400 }}>/ {totalAlumnos} alumnos</span>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.25rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Entregas Calificadas</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                  {calificadosCount} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 400 }}>/ {entregadosCount}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1.25rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Promedio de Notas</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
                  {promedioCalculado}
                </div>
              </div>
            </div>

            {/* List of Submissions */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 700, color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Entregas de los alumnos ({entregas.length})</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Haz clic en "Calificar" para abrir la corrección</span>
              </div>

              {entregas.length === 0 ? (
                <div style={{ padding: '2rem' }}>
                  <EmptyState title="Sin alumnos en la clase" description="No hay alumnos inscriptos en esta clase todavía." icon="bx-folder-open" />
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Alumno</th>
                        <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Fecha de Entrega</th>
                        <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Archivo</th>
                        <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Estado</th>
                        <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Calificación</th>
                        <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entregas.map((ent: any, idx: number) => (
                        <tr key={ent.alumno_id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{ent.alumno_nombre}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{ent.alumno_correo}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                            {ent.fecha_entrega ? new Date(ent.fecha_entrega).toLocaleString('es-ES') : '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            {ent.archivo_path ? (
                              <a
                                href={`${BACKEND_URL}/uploads/${ent.archivo_path}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                              >
                                <i className="bx bx-file"></i> {ent.archivo_nombre || 'Descargar'}
                              </a>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin archivo</span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span className={`badge ${
                              ent.estado === 'corregido' ? 'badge-green' :
                              ent.estado === 'entregado' ? 'badge-purple' :
                              ent.estado === 'entrega_tardia' ? 'badge-rose' : 'badge-amber'
                            }`}>
                              {ent.estado === 'corregido' ? 'Corregido' :
                               ent.estado === 'entregado' ? 'Entregado' :
                               ent.estado === 'entrega_tardia' ? 'Tardío' : 'Sin entregar'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: ent.calificacion !== null && ent.calificacion !== undefined ? '#34d399' : '#94a3b8' }}>
                            {ent.calificacion !== null && ent.calificacion !== undefined ? `${ent.calificacion} / ${trabajo?.puntos_max || 20}` : '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenGradeModal(idx)}
                              style={{
                                padding: '0.45rem 0.9rem',
                                borderRadius: '8px',
                                background: ent.estado === 'corregido' ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                color: '#fff',
                                border: ent.estado === 'corregido' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {ent.estado === 'corregido' ? 'Editar Nota' : 'Calificar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Grading Modal with student carousel/navigation */}
            {currentEditingEntrega && editingIndex !== null && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
              }}>
                <div style={{
                  background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                  width: '100%', maxWidth: '520px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'
                }}>
                  {/* Top Bar with Carousel Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                        Alumno {editingIndex + 1} de {entregas.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        disabled={editingIndex === 0}
                        onClick={() => handleNavigateStudent('prev')}
                        style={{
                          padding: '0.35rem 0.6rem', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          color: editingIndex === 0 ? '#475569' : '#cbd5e1', cursor: editingIndex === 0 ? 'not-allowed' : 'pointer'
                        }}
                        title="Alumno anterior"
                      >
                        <i className="bx bx-chevron-left"></i>
                      </button>
                      <button
                        type="button"
                        disabled={editingIndex === entregas.length - 1}
                        onClick={() => handleNavigateStudent('next')}
                        style={{
                          padding: '0.35rem 0.6rem', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          color: editingIndex === entregas.length - 1 ? '#475569' : '#cbd5e1', cursor: editingIndex === entregas.length - 1 ? 'not-allowed' : 'pointer'
                        }}
                        title="Alumno siguiente"
                      >
                        <i className="bx bx-chevron-right"></i>
                      </button>
                      <button onClick={() => setEditingIndex(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '0.5rem' }}>×</button>
                    </div>
                  </div>

                  {/* Student Info & Submission Details */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>{currentEditingEntrega.alumno_nombre}</div>
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{currentEditingEntrega.alumno_correo}</div>
                      </div>
                      <span className={`badge ${
                        currentEditingEntrega.estado === 'corregido' ? 'badge-green' :
                        currentEditingEntrega.estado === 'entregado' ? 'badge-purple' :
                        currentEditingEntrega.estado === 'entrega_tardia' ? 'badge-rose' : 'badge-amber'
                      }`}>
                        {currentEditingEntrega.estado === 'corregido' ? 'Corregido' :
                         currentEditingEntrega.estado === 'entregado' ? 'Entregado' :
                         currentEditingEntrega.estado === 'entrega_tardia' ? 'Tardío' : 'Sin entregar'}
                      </span>
                    </div>

                    {currentEditingEntrega.archivo_path && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <a
                          href={`${BACKEND_URL}/uploads/${currentEditingEntrega.archivo_path}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}
                        >
                          <i className="bx bx-download"></i> Descargar archivo: {currentEditingEntrega.archivo_nombre || 'archivo_entrega'}
                        </a>
                      </div>
                    )}

                    {currentEditingEntrega.comentario && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                        "{currentEditingEntrega.comentario}"
                      </div>
                    )}
                  </div>

                  {/* Grading Form */}
                  <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                        Nota (Máximo {trabajo?.puntos_max || 10}):
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={trabajo?.puntos_max || 10}
                          required
                          value={calificacionInput}
                          onChange={(e) => setCalificacionInput(e.target.value)}
                          placeholder={`0 - ${trabajo?.puntos_max || 10}`}
                          style={{
                            flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.8)',
                            color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '1.1rem', fontWeight: 700
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseFloat(calificacionInput) || 0;
                              setCalificacionInput(String(Math.max(0, current - 1)));
                            }}
                            style={{
                              padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', cursor: 'pointer', fontSize: '1.1rem'
                            }}
                            title="Bajar 1 punto"
                          >
                            <i className="bx bx-minus"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseFloat(calificacionInput) || 0;
                              const max = trabajo?.puntos_max || 20;
                              setCalificacionInput(String(Math.min(max, current + 1)));
                            }}
                            style={{
                              padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', cursor: 'pointer', fontSize: '1.1rem'
                            }}
                            title="Subir 1 punto"
                          >
                            <i className="bx bx-plus"></i>
                          </button>
                        </div>
                      </div>

                      {/* Quick preset chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                        {[0, 5, 10, 12, 14, 16, 18, 20].filter(n => n <= (trabajo?.puntos_max || 20)).map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setCalificacionInput(String(n))}
                            style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              background: calificacionInput === String(n) ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                              border: calificacionInput === String(n) ? '1px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: calificacionInput === String(n) ? '#c4b5fd' : '#94a3b8',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                        Feedback / Devolución:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Escribe tus observaciones para el alumno..."
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        style={{
                          width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.8)',
                          color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '0.9rem', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        style={{
                          padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                          color: '#cbd5e1', border: 'none', cursor: 'pointer', fontWeight: 600
                        }}
                      >
                        Cancelar
                      </button>
                      <Button type="submit" variant="primary" loading={savingGrade}>
                        Guardar Calificación
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default TrabajoProfesorPage;
