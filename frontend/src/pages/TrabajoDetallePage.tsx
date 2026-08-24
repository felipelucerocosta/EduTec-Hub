import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components reutilizables/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { useToast } from '../contexts/ToastContext';

const API_URL = "http://localhost:3001/api";

interface TrabajoDetalle {
  id: number;
  clase_id: number;
  clase_nombre?: string;
  creador_nombre?: string;
  titulo: string;
  descripcion?: string;
  instrucciones?: string;
  fecha_limite?: string;
  puntos_max?: number;
  mi_entrega?: {
    id: number;
    archivo_nombre?: string;
    archivo_path?: string;
    comentario?: string;
    estado: string;
    calificacion?: number;
    feedback?: string;
    fecha_entrega?: string;
  } | null;
}

const TrabajoDetallePage: React.FC = () => {
  const { trabajoId } = useParams<{ trabajoId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const archivoRef = useRef<HTMLInputElement>(null);

  const [trabajo, setTrabajo] = useState<TrabajoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [comentario, setComentario] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const fetchTrabajo = async () => {
    if (!trabajoId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/trabajos/${trabajoId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTrabajo(data);
        if (data.mi_entrega?.comentario) {
          setComentario(data.mi_entrega.comentario);
        }
      } else {
        showToast("Error al obtener los detalles del trabajo.", "error");
      }
    } catch (err) {
      console.error("Error al cargar trabajo:", err);
      showToast("Error de conexión con el servidor.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrabajo();
  }, [trabajoId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleEntregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trabajoId) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("archivo", selectedFile);
      }
      formData.append("comentario", comentario);

      const res = await fetch(`${API_URL}/trabajos/${trabajoId}/entregar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "¡Trabajo entregado con éxito!", "success");
        fetchTrabajo();
      } else {
        showToast(data.error || "No se pudo entregar el trabajo.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al subir la entrega.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetirar = async () => {
    if (!trabajoId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/trabajos/${trabajoId}/retirar`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Entrega retirada.", "info");
        setConfirmWithdraw(false);
        fetchTrabajo();
      } else {
        showToast(data.error || "No se pudo retirar la entrega.", "error");
      }
    } catch (err) {
      showToast("Error al retirar la entrega.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <LoadingSkeleton type="card" count={2} />
        </div>
      </AppLayout>
    );
  }

  if (!trabajo) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h3>Trabajo no encontrado</h3>
          <p style={{ color: '#94a3b8' }}>El trabajo solicitado no existe o no tienes permiso para acceder.</p>
          <Button onClick={() => navigate('/alumno')} icon="bx-arrow-back" style={{ marginTop: '1rem' }}>
            Volver a Mis Clases
          </Button>
        </div>
      </AppLayout>
    );
  }

  const entrega = trabajo.mi_entrega;
  const isEntregado = Boolean(entrega && entrega.estado !== 'retirado');
  const now = new Date();
  const fechaLimite = trabajo.fecha_limite ? new Date(trabajo.fecha_limite) : null;
  const esVencido = fechaLimite ? fechaLimite < now : false;

  let badgeClass = 'badge-amber';
  let estadoText = '🟡 Pendiente';

  if (isEntregado) {
    if (entrega?.estado === 'corregido') {
      badgeClass = 'badge-green';
      estadoText = '🟢 Calificado';
    } else if (entrega?.estado === 'entrega_tardia') {
      badgeClass = 'badge-rose';
      estadoText = '🔴 Fuera de término';
    } else {
      badgeClass = 'badge-purple';
      estadoText = '🟣 Entregado';
    }
  } else if (esVencido) {
    badgeClass = 'badge-rose';
    estadoText = '🔴 Fuera de término (Sin entregar)';
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Navigation bar & header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate(`/alumno/gestion/${trabajo.clase_id}`)}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600
            }}
          >
            <i className="bx bx-arrow-back" style={{ fontSize: '1.2rem' }}></i>
            Volver a la clase ({trabajo.clase_nombre || 'Materia'})
          </button>
          
          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {estadoText}
          </span>
        </div>

        {/* Main Layout Grid: Left (Details) + Right (Submission panel) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
          
          {/* Main Task Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div>
              <div style={{ color: '#38bdf8', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                <i className="bx bx-book-open" style={{ marginRight: '0.35rem' }}></i>
                {trabajo.clase_nombre || "Materia"} · Profesor: {trabajo.creador_nombre || "Docente"}
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.3 }}>
                {trabajo.titulo}
              </h1>
              
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1rem',
                paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)',
                fontSize: '0.85rem', color: '#94a3b8'
              }}>
                <span>
                  <i className="bx bx-calendar" style={{ color: '#a78bfa', marginRight: '0.35rem' }}></i>
                  <strong>Fecha Límite:</strong> {fechaLimite ? fechaLimite.toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Sin vencimiento"}
                </span>
                <span>
                  <i className="bx bx-trophy" style={{ color: '#fbbf24', marginRight: '0.35rem' }}></i>
                  <strong>Puntos Máximos:</strong> {trabajo.puntos_max || 100} pts
                </span>
              </div>
            </div>

            {/* Description & Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {trabajo.descripcion && (
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>
                    Descripción
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                    {trabajo.descripcion}
                  </p>
                </div>
              )}

              {trabajo.instrucciones && (
                <div style={{
                  background: 'rgba(124, 58, 237, 0.08)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: '14px',
                  padding: '1.25rem'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a78bfa', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="bx bx-info-circle" style={{ fontSize: '1.2rem' }}></i>
                    Instrucciones de Entrega
                  </h4>
                  <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                    {trabajo.instrucciones}
                  </p>
                </div>
              )}
            </div>

            {/* Feedback Section if Graded */}
            {entrega && entrega.estado === 'corregido' && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.05))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="bx bx-check-double" style={{ fontSize: '1.4rem' }}></i> Devolución del Docente
                  </span>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.2)', color: '#34d399',
                    padding: '6px 14px', borderRadius: '12px', fontWeight: 800, fontSize: '1.2rem'
                  }}>
                    {entrega.calificacion} / {trabajo.puntos_max || 100}
                  </div>
                </div>
                {entrega.feedback ? (
                  <p style={{ color: '#f1f5f9', fontSize: '0.92rem', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{entrega.feedback}"
                  </p>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Sin comentarios adicionales.</p>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Submission Widget */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Tu Entrega
                </h3>
                <span className={`badge ${badgeClass}`}>
                  {isEntregado ? 'Entregado' : 'Sin entregar'}
                </span>
              </div>

              {isEntregado && entrega ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {entrega.archivo_nombre && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px', padding: '0.85rem 1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <i className="bx bx-file" style={{ fontSize: '1.6rem', color: '#38bdf8', flexShrink: 0 }}></i>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {entrega.archivo_nombre}
                        </span>
                      </div>
                      {entrega.archivo_path && (
                        <a
                          href={`${API_URL}/entregas/descargar/${entrega.archivo_path}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#38bdf8', fontSize: '1.2rem' }}
                          title="Descargar"
                        >
                          <i className="bx bx-download"></i>
                        </a>
                      )}
                    </div>
                  )}

                  {entrega.comentario && (
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px' }}>
                      <strong style={{ color: '#94a3b8' }}>Comentario adjunto:</strong>
                      <p style={{ margin: '0.25rem 0 0', lineHeight: 1.4 }}>{entrega.comentario}</p>
                    </div>
                  )}

                  {entrega.fecha_entrega && (
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Enviado el: {new Date(entrega.fecha_entrega).toLocaleString('es-ES')}
                    </span>
                  )}

                  {/* Withdraw submission option */}
                  {entrega.estado !== 'corregido' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {!confirmWithdraw ? (
                        <Button
                          variant="outline"
                          onClick={() => setConfirmWithdraw(true)}
                          disabled={submitting}
                          style={{ width: '100%', fontSize: '0.88rem' }}
                          icon="bx-undo"
                        >
                          Anular o Reemplazar Entrega
                        </Button>
                      ) : (
                        <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                          <p style={{ fontSize: '0.82rem', color: '#fb7185', margin: '0 0 0.75rem' }}>
                            ¿Estás seguro de anular esta entrega para subir una versión corregida?
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button variant="danger" onClick={handleRetirar} loading={submitting} style={{ flex: 1, fontSize: '0.8rem' }}>
                              Sí, Anular
                            </Button>
                            <Button variant="secondary" onClick={() => setConfirmWithdraw(false)} style={{ flex: 1, fontSize: '0.8rem' }}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleEntregar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* File Upload Dropzone */}
                  <div
                    onClick={() => archivoRef.current?.click()}
                    style={{
                      border: '2px dashed rgba(124, 58, 237, 0.4)',
                      borderRadius: '14px', padding: '1.5rem 1rem',
                      textAlign: 'center', cursor: 'pointer',
                      background: 'rgba(124, 58, 237, 0.05)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.7)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)'}
                  >
                    <input type="file" ref={archivoRef} onChange={handleFileChange} style={{ display: 'none' }} />
                    <i className="bx bx-cloud-upload" style={{ fontSize: '2.5rem', color: '#a78bfa', marginBottom: '0.35rem' }}></i>
                    {selectedFile ? (
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#38bdf8', fontSize: '0.88rem' }}>{selectedFile.name}</p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#f1f5f9', fontSize: '0.88rem' }}>Adjuntar archivo</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>PDF, ZIP, DOCX, Código (Máx 25MB)</p>
                      </div>
                    )}
                  </div>

                  <textarea
                    placeholder="Agregar comentarios para el profesor (opcional)..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px', padding: '0.75rem 0.9rem',
                      color: '#f8fafc', fontSize: '0.88rem', resize: 'vertical'
                    }}
                  />

                  <Button type="submit" loading={submitting} icon="bx-send" style={{ width: '100%', padding: '0.85rem' }}>
                    ENTREGAR TRABAJO
                  </Button>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
};

export default TrabajoDetallePage;
