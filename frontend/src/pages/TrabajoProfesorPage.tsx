import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components reutilizables/Button';
import { useToast } from '../contexts/ToastContext';

const API_URL = 'http://localhost:3001/api';

const TrabajoProfesorPage: React.FC = () => {
  const { claseId, trabajoId } = useParams<{ claseId: string; trabajoId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [trabajo, setTrabajo] = useState<any>(null);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [editingEntrega, setEditingEntrega] = useState<any>(null);
  const [calificacionInput, setCalificacionInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

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
  }, [trabajoId]);

  const handleOpenGradeModal = (entrega: any) => {
    setEditingEntrega(entrega);
    setCalificacionInput(entrega.calificacion !== null && entrega.calificacion !== undefined ? String(entrega.calificacion) : '');
    setFeedbackInput(entrega.feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntrega) return;

    const nota = parseFloat(calificacionInput);
    if (isNaN(nota) || nota < 0 || (trabajo?.puntos_max && nota > trabajo.puntos_max)) {
      showToast(`Ingresa una calificación válida (0 a ${trabajo?.puntos_max || 10})`, 'error');
      return;
    }

    setSavingGrade(true);
    try {
      const res = await fetch(`${API_URL}/entregas/${editingEntrega.id}/calificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ calificacion: nota, feedback: feedbackInput })
      });

      if (res.ok) {
        showToast('¡Calificación guardada con éxito!', 'success');
        // Update local state
        setEntregas((prev) =>
          prev.map((item) =>
            item.id === editingEntrega.id
              ? { ...item, calificacion: nota, feedback: feedbackInput, estado: 'corregido' }
              : item
          )
        );
        setEditingEntrega(null);
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

  const entregadosCount = entregas.length;
  const calificadosCount = entregas.filter((e) => e.estado === 'corregido' && e.calificacion !== null).length;
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
            <i className="bx bx-arrow-back"></i> Volver a la gestión de clase
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="bx bx-task" style={{ color: '#7c3aed' }}></i> {trabajo?.titulo || 'Detalle del Trabajo (Profesor)'}
          </h1>
          {trabajo && (
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Fecha límite: <strong style={{ color: '#cbd5e1' }}>{trabajo.fecha_limite ? new Date(trabajo.fecha_limite).toLocaleDateString() : 'Sin fecha'}</strong> — Puntaje Máximo: <strong style={{ color: '#38bdf8' }}>{trabajo.puntos_max || 10} pts</strong>
            </p>
          )}
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.3)', padding: '1.25rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total de Entregas</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
                  {entregadosCount}
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
              <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 700, color: '#f8fafc' }}>
                Entregas recibidas ({entregas.length})
              </div>

              {entregas.length === 0 ? (
                <div style={{ padding: '2rem' }}>
                  <EmptyState title="Sin entregas aún" description="Los alumnos todavía no han subido entregas para este trabajo." icon="bx-folder-open" />
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Alumno</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Fecha de Entrega</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Archivo</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Estado</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Calificación</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entregas.map((ent: any) => (
                      <tr key={ent.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{ent.alumno_nombre}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{ent.alumno_correo}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                          {ent.fecha_entrega ? new Date(ent.fecha_entrega).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          {ent.archivo_path ? (
                            <a
                              href={`http://localhost:3001/uploads/${ent.archivo_path}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                            >
                              <i className="bx bx-file"></i> {ent.archivo_nombre || 'Descargar archivo'}
                            </a>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin archivo</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span className={`badge ${ent.estado === 'corregido' ? 'badge-green' : ent.estado === 'entrega_tardia' ? 'badge-red' : 'badge-purple'}`}>
                            {ent.estado}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: ent.calificacion !== null ? '#34d399' : '#94a3b8' }}>
                          {ent.calificacion !== null && ent.calificacion !== undefined ? `${ent.calificacion} / ${trabajo?.puntos_max || 10}` : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <button
                            onClick={() => handleOpenGradeModal(ent)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '8px',
                              background: ent.estado === 'corregido' ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                              color: '#fff',
                              border: 'none',
                              fontSize: '0.8rem',
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
              )}
            </div>

            {/* Grading Modal */}
            {editingEntrega && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
              }}>
                <div style={{
                  background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                  width: '100%', maxWidth: '480px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.2rem' }}>Calificar Entrega</h3>
                    <button onClick={() => setEditingEntrega(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                  </div>

                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{editingEntrega.alumno_nombre}</div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{editingEntrega.alumno_correo}</div>
                    {editingEntrega.comentario && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                        "{editingEntrega.comentario}"
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                        Nota (Máximo {trabajo?.puntos_max || 10}):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={trabajo?.puntos_max || 10}
                        required
                        value={calificacionInput}
                        onChange={(e) => setCalificacionInput(e.target.value)}
                        style={{
                          width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.8)',
                          color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '1rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                        Feedback / Devolución:
                      </label>
                      <textarea
                        rows={4}
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
                        onClick={() => setEditingEntrega(null)}
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
