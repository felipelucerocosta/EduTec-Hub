import React, { useState, useEffect } from 'react';
import AulaActivaAPI, { type TrabajoItem, type ConsultaItem, type ClaseOption } from '../../services/aula_activa_api';
import styles from './aula_activa.module.css';

export const AulaActivaAlumnoView: React.FC = () => {
  const [clases, setClases] = useState<ClaseOption[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState<number | null>(null);
  const [trabajos, setTrabajos] = useState<TrabajoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'trabajos' | 'consultas'>('trabajos');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Entrega
  const [trabajoAEntregar, setTrabajoAEntregar] = useState<TrabajoItem | null>(null);
  const [comentarioEntrega, setComentarioEntrega] = useState<string>('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [enviandoEntrega, setEnviandoEntrega] = useState<boolean>(false);

  // Consultas
  const [consultas, setConsultas] = useState<ConsultaItem[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState<string>('');

  useEffect(() => {
    cargarClases();
  }, []);

  useEffect(() => {
    if (claseSeleccionada) {
      cargarDatosClase(claseSeleccionada);
    }
  }, [claseSeleccionada]);

  const cargarClases = async () => {
    try {
      setLoading(true);
      const data = await AulaActivaAPI.getClasesAlumno();
      setClases(data);
      if (data.length > 0) {
        setClaseSeleccionada(data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar clases de alumno:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosClase = async (claseId: number) => {
    try {
      const [tList, cList] = await Promise.all([
        AulaActivaAPI.getTrabajos(claseId),
        AulaActivaAPI.getConsultas(claseId).catch(() => []),
      ]);
      setTrabajos(tList);
      setConsultas(cList);
    } catch (err) {
      console.error('Error al cargar datos en Aula Activa Alumno:', err);
    }
  };

  const handleEntregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trabajoAEntregar) return;

    try {
      setEnviandoEntrega(true);
      await AulaActivaAPI.entregarTrabajo(trabajoAEntregar.id, {
        comentario: comentarioEntrega,
        archivo: archivoSeleccionado || undefined,
      });
      setTrabajoAEntregar(null);
      setComentarioEntrega('');
      setArchivoSeleccionado(null);
      if (claseSeleccionada) {
        cargarDatosClase(claseSeleccionada);
      }
    } catch (err: any) {
      alert(err.message || 'Error al enviar entrega');
    } finally {
      setEnviandoEntrega(false);
    }
  };

  const handleEnviarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claseSeleccionada || !nuevoMensaje.trim()) return;

    try {
      await AulaActivaAPI.publicarConsulta(claseSeleccionada, nuevoMensaje);
      setNuevoMensaje('');
      const updated = await AulaActivaAPI.getConsultas(claseSeleccionada);
      setConsultas(updated);
    } catch (err: any) {
      alert(err.message || 'Error al enviar mensaje');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
        <p>Cargando Aula Activa...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className={styles.controlsBar}>
        <div className={styles.selectorGroup}>
          <label htmlFor="claseAlumnoSelectCore" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Materia:</label>
          <select
            id="claseAlumnoSelectCore"
            aria-label="Seleccionar materia"
            className={styles.selectInput}
            value={claseSeleccionada || ''}
            onChange={(e) => setClaseSeleccionada(Number(e.target.value))}
          >
            {clases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.seccion ? `(${c.seccion})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'trabajos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('trabajos')}
        >
          <i className="bx bx-book-reader"></i> Mis Actividades ({trabajos.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'consultas' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('consultas')}
        >
          <i className="bx bx-chat"></i> Consultas con el Profesor ({consultas.length})
        </button>
      </div>

      {activeTab === 'trabajos' && (
        <div className={styles.cardsGrid}>
          {trabajos.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="bx bx-check-circle" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
              <p>¡Estás al día! No hay trabajos prácticos asignados en esta materia.</p>
            </div>
          ) : (
            trabajos.map((t) => {
              const miEntrega = t.mi_entrega;
              const tieneNota = miEntrega && miEntrega.calificacion !== null && miEntrega.calificacion !== undefined;

              return (
                <div key={t.id} className={styles.assignmentCard}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{t.titulo}</h3>
                    {tieneNota ? (
                      <span className={`${styles.badge} ${miEntrega.calificacion! >= 6 ? styles.badgeSuccess : styles.badgeDanger}`}>
                        Calificación: {miEntrega.calificacion}/10
                      </span>
                    ) : miEntrega ? (
                      <span className={`${styles.badge} ${styles.badgeWarning}`}>
                        Entregado (En revisión)
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeDanger}`}>
                        Pendiente
                      </span>
                    )}
                  </div>

                  <p className={styles.cardDesc}>{t.descripcion || t.instrucciones || 'Sin instrucciones adicionales.'}</p>

                  {miEntrega?.feedback && (
                    <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: '8px', padding: '0.65rem', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 600, color: '#c084fc', marginBottom: '0.2rem' }}>
                        <i className="bx bx-message-rounded-check" style={{ marginRight: '0.25rem' }}></i> Devolución Docente:
                      </div>
                      <div style={{ color: '#e2e8f0' }}>{miEntrega.feedback}</div>
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <span>
                      <i className="bx bx-calendar" style={{ marginRight: '0.25rem' }}></i>
                      {t.fecha_limite ? new Date(t.fecha_limite).toLocaleDateString() : 'Sin fecha límite'}
                    </span>

                    <button
                      type="button"
                      className={miEntrega ? styles.secondaryBtn : styles.primaryBtn}
                      onClick={() => setTrabajoAEntregar(t)}
                    >
                      <i className="bx bx-upload"></i> {miEntrega ? 'Reentregar' : 'Enviar Entrega'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'consultas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={styles.consultasChat}>
            {consultas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', margin: '2rem 0' }}>
                No hay mensajes aún. ¡Haz tu consulta al profesor por aquí!
              </p>
            ) : (
              consultas.map((c) => (
                <div
                  key={c.id}
                  className={`${styles.chatMessage} ${c.usuario_rol === 'alumno' ? styles.chatMessageMy : styles.chatMessageOther}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>{c.usuario_nombre} ({c.usuario_rol})</span>
                    <span>{new Date(c.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#f8fafc' }}>{c.mensaje}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleEnviarConsulta} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className={styles.formInput}
              style={{ flex: 1 }}
              placeholder="Escribe tu consulta pedagógica para el docente..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
            />
            <button type="submit" className={styles.primaryBtn}>
              <i className="bx bx-send"></i> Consultar
            </button>
          </form>
        </div>
      )}

      {trabajoAEntregar && (
        <div className={styles.modalOverlay} onClick={() => setTrabajoAEntregar(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Entrega: {trabajoAEntregar.titulo}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Máximo: {trabajoAEntregar.puntos_max} puntos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrabajoAEntregar(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEntregar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Comentario o resolución escrita</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Detalla tu respuesta, enlaces o notas para el profesor..."
                  value={comentarioEntrega}
                  onChange={(e) => setComentarioEntrega(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Adjuntar Archivo (PDF, ZIP, DOCX, código)</label>
                <input
                  type="file"
                  className={styles.formInput}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArchivoSeleccionado(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setTrabajoAEntregar(null)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={enviandoEntrega}>
                  {enviandoEntrega ? (
                    <>
                      <i className="bx bx-loader-alt bx-spin"></i> Enviando...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-cloud-upload"></i> Confirmar Entrega
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AulaActivaAlumnoView;

