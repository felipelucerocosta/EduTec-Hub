import React, { useState, useEffect } from 'react';
import AulaActivaAPI, { type TrabajoItem, type EntregaItem, type ConsultaItem, type MetricasClase, type ClaseOption } from '../services/aula_activa_api';
import styles from '../styles/aula_activa.module.css';

export const AulaActivaDocenteView: React.FC = () => {
  const [clases, setClases] = useState<ClaseOption[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState<number | null>(null);
  const [trabajos, setTrabajos] = useState<TrabajoItem[]>([]);
  const [metricas, setMetricas] = useState<MetricasClase | null>(null);
  const [activeTab, setActiveTab] = useState<'trabajos' | 'consultas'>('trabajos');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Crear/Editar Trabajo
  const [modalTrabajo, setModalTrabajo] = useState<boolean>(false);
  const [nuevoTitulo, setNuevoTitulo] = useState<string>('');
  const [nuevaDesc, setNuevaDesc] = useState<string>('');
  const [nuevasInstrucciones, setNuevasInstrucciones] = useState<string>('');
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState<string>('');
  const [nuevosPuntos, setNuevosPuntos] = useState<number>(10);
  const [tipoEntrega, setTipoEntrega] = useState<string>('individual');

  // Modal Entregas de un trabajo
  const [trabajoVerEntregas, setTrabajoVerEntregas] = useState<TrabajoItem | null>(null);
  const [entregas, setEntregas] = useState<EntregaItem[]>([]);
  const [loadingEntregas, setLoadingEntregas] = useState<boolean>(false);

  // Modal Calificar
  const [entregaACalificar, setEntregaACalificar] = useState<EntregaItem | null>(null);
  const [calificacionNota, setCalificacionNota] = useState<string>('10');
  const [feedbackPedagogico, setFeedbackPedagogico] = useState<string>('');
  const [errorCalificacion, setErrorCalificacion] = useState<string | null>(null);

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
      const data = await AulaActivaAPI.getClasesDocente();
      setClases(data);
      if (data.length > 0) {
        setClaseSeleccionada(data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar clases docente:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosClase = async (claseId: number) => {
    try {
      const [tList, mData, cList] = await Promise.all([
        AulaActivaAPI.getTrabajos(claseId),
        AulaActivaAPI.getMetricasClase(claseId).catch(() => null),
        AulaActivaAPI.getConsultas(claseId).catch(() => []),
      ]);
      setTrabajos(tList);
      setMetricas(mData);
      setConsultas(cList);
    } catch (err) {
      console.error('Error al cargar datos de clase:', err);
    }
  };

  const handleCrearTrabajo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claseSeleccionada || !nuevoTitulo.trim()) return;

    try {
      await AulaActivaAPI.crearTrabajo(claseSeleccionada, {
        titulo: nuevoTitulo,
        descripcion: nuevaDesc,
        instrucciones: nuevasInstrucciones,
        fecha_limite: nuevaFechaLimite || undefined,
        puntos_max: nuevosPuntos,
        tipo_entrega: tipoEntrega,
      });
      setModalTrabajo(false);
      setNuevoTitulo('');
      setNuevaDesc('');
      setNuevasInstrucciones('');
      setNuevaFechaLimite('');
      cargarDatosClase(claseSeleccionada);
    } catch (err: any) {
      alert(err.message || 'Error al publicar trabajo');
    }
  };

  const abrirEntregas = async (trabajo: TrabajoItem) => {
    setTrabajoVerEntregas(trabajo);
    setLoadingEntregas(true);
    try {
      const list = await AulaActivaAPI.getEntregasTrabajo(trabajo.id);
      setEntregas(list);
    } catch (err) {
      console.error('Error al cargar entregas:', err);
    } finally {
      setLoadingEntregas(false);
    }
  };

  const handleCalificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entregaACalificar) return;
    setErrorCalificacion(null);

    const notaNum = Number(calificacionNota);
    if (isNaN(notaNum) || notaNum < 1 || notaNum > 10) {
      setErrorCalificacion('La calificación debe estar entre 1 y 10');
      return;
    }

    if (notaNum < 6 && (!feedbackPedagogico || !feedbackPedagogico.trim())) {
      setErrorCalificacion('La retroalimentación pedagógica es obligatoria para notas menores a 6.');
      return;
    }

    try {
      await AulaActivaAPI.calificarEntrega(entregaACalificar.id, notaNum, feedbackPedagogico);
      setEntregaACalificar(null);
      setFeedbackPedagogico('');
      if (trabajoVerEntregas) {
        abrirEntregas(trabajoVerEntregas);
      }
      if (claseSeleccionada) {
        cargarDatosClase(claseSeleccionada);
      }
    } catch (err: any) {
      setErrorCalificacion(err.message || 'Error al calificar');
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
      {/* Barra de Controles y Selector de Clase */}
      <div className={styles.controlsBar}>
        <div className={styles.selectorGroup}>
          <label htmlFor="claseDocenteSelect" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Comisión:</label>
          <select
            id="claseDocenteSelect"
            aria-label="Seleccionar comisión"
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

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => setModalTrabajo(true)}
          disabled={!claseSeleccionada}
        >
          <i className="bx bx-plus-circle"></i> Publicar Consigna
        </button>
      </div>

      {/* Métricas en tiempo real */}
      {metricas && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#c084fc' }}>
              <i className="bx bx-task"></i>
            </div>
            <div>
              <div className={styles.metricValue}>{metricas.totalTrabajos}</div>
              <div className={styles.metricLabel}>Trabajos Publicados</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <i className="bx bx-upload"></i>
            </div>
            <div>
              <div className={styles.metricValue}>{metricas.totalEntregas}</div>
              <div className={styles.metricLabel}>Entregas Recibidas</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <i className="bx bx-time-five"></i>
            </div>
            <div>
              <div className={styles.metricValue}>{metricas.pendientes}</div>
              <div className={styles.metricLabel}>Pendientes de Corrección</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <i className="bx bx-check-double"></i>
            </div>
            <div>
              <div className={styles.metricValue}>{metricas.corregidas}</div>
              <div className={styles.metricLabel}>Corregidas</div>
            </div>
          </div>
        </div>
      )}

      {/* Pestañas: Trabajos vs Consultas */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'trabajos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('trabajos')}
        >
          <i className="bx bx-book-content"></i> Actividades y Trabajos ({trabajos.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'consultas' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('consultas')}
        >
          <i className="bx bx-chat"></i> Foro Pedagógico ({consultas.length})
        </button>
      </div>

      {/* Vista de Trabajos */}
      {activeTab === 'trabajos' && (
        <div className={styles.cardsGrid}>
          {trabajos.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="bx bx-folder-open" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
              <p>No hay actividades publicadas para esta comisión aún.</p>
            </div>
          ) : (
            trabajos.map((t) => (
              <div key={t.id} className={styles.assignmentCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{t.titulo}</h3>
                  <span className={`${styles.badge} ${styles.badgeInfo}`}>
                    {t.puntos_max} pts
                  </span>
                </div>
                <p className={styles.cardDesc}>{t.descripcion || t.instrucciones || 'Sin descripción adicional.'}</p>
                <div className={styles.cardFooter}>
                  <span>
                    <i className="bx bx-calendar" style={{ marginRight: '0.25rem' }}></i>
                    {t.fecha_limite ? new Date(t.fecha_limite).toLocaleDateString() : 'Sin fecha límite'}
                  </span>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => abrirEntregas(t)}
                  >
                    <i className="bx bx-list-check"></i> Ver Entregas
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Vista de Consultas / Foro */}
      {activeTab === 'consultas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={styles.consultasChat}>
            {consultas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', margin: '2rem 0' }}>
                No hay consultas registradas en este espacio pedagógico.
              </p>
            ) : (
              consultas.map((c) => (
                <div
                  key={c.id}
                  className={`${styles.chatMessage} ${c.usuario_rol === 'profesor' ? styles.chatMessageMy : styles.chatMessageOther}`}
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
              placeholder="Escribe una respuesta u orientación pedagógica..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
            />
            <button type="submit" className={styles.primaryBtn}>
              <i className="bx bx-send"></i> Enviar
            </button>
          </form>
        </div>
      )}

      {/* Modal Publicar Trabajo */}
      {modalTrabajo && (
        <div className={styles.modalOverlay} onClick={() => setModalTrabajo(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Publicar Nueva Actividad</h2>
              <button
                type="button"
                onClick={() => setModalTrabajo(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCrearTrabajo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Título de la consigna *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  placeholder="Ej: Trabajo Práctico N° 1 - Programación Modular"
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descripción y Objetivos</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Resumen pedagógico de la actividad..."
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Instrucciones de entrega</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Pautas para la entrega (formato de archivo, criterios)..."
                  value={nuevasInstrucciones}
                  onChange={(e) => setNuevasInstrucciones(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Fecha Límite</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={nuevaFechaLimite}
                    onChange={(e) => setNuevaFechaLimite(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Puntaje Máximo</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className={styles.formInput}
                    value={nuevosPuntos}
                    onChange={(e) => setNuevosPuntos(Number(e.target.value))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Modalidad</label>
                  <select
                    className={styles.formInput}
                    value={tipoEntrega}
                    onChange={(e) => setTipoEntrega(e.target.value)}
                  >
                    <option value="individual">Individual</option>
                    <option value="grupal">Grupal</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setModalTrabajo(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  <i className="bx bx-check"></i> Publicar en Aula Activa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Entregas */}
      {trabajoVerEntregas && (
        <div className={styles.modalOverlay} onClick={() => setTrabajoVerEntregas(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Entregas: {trabajoVerEntregas.titulo}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Total recibidas: {entregas.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrabajoVerEntregas(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {loadingEntregas ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '1.5rem' }}></i>
                <p>Cargando entregas...</p>
              </div>
            ) : entregas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>
                Aún ningún estudiante ha registrado una entrega para este trabajo.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {entregas.map((ent) => (
                  <div
                    key={ent.id}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.92rem' }}>
                        {ent.alumno_nombre}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {ent.alumno_correo} | Entregado: {new Date(ent.fecha_entrega).toLocaleString()}
                      </div>
                      {ent.comentario && (
                        <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.35rem', fontStyle: 'italic' }}>
                          "{ent.comentario}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {ent.calificacion !== null && ent.calificacion !== undefined ? (
                        <span className={`${styles.badge} ${ent.calificacion >= 6 ? styles.badgeSuccess : styles.badgeDanger}`}>
                          Nota: {ent.calificacion}/10
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeWarning}`}>
                          Pendiente
                        </span>
                      )}

                      <button
                        type="button"
                        className={styles.primaryBtn}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          setEntregaACalificar(ent);
                          setCalificacionNota(ent.calificacion ? String(ent.calificacion) : '10');
                          setFeedbackPedagogico(ent.feedback || '');
                        }}
                      >
                        <i className="bx bx-check-shield"></i> Corregir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Calificar Entrega con Feedback pedagógico obligatorio si < 6 */}
      {entregaACalificar && (
        <div className={styles.modalOverlay} onClick={() => setEntregaACalificar(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Corregir Entrega de {entregaACalificar.alumno_nombre}
              </h2>
              <button
                type="button"
                onClick={() => setEntregaACalificar(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {errorCalificacion && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.65rem', borderRadius: '8px', fontSize: '0.84rem' }}>
                {errorCalificacion}
              </div>
            )}

            <form onSubmit={handleCalificar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Calificación Oficial (1 a 10) *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  className={styles.formInput}
                  value={calificacionNota}
                  onChange={(e) => setCalificacionNota(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Retroalimentación Pedagógica {Number(calificacionNota) < 6 ? '(Obligatoria por ser nota < 6)' : '(Opcional)'}
                </label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Detalla las observaciones pedagógicas, aciertos y aspectos a mejorar..."
                  value={feedbackPedagogico}
                  onChange={(e) => setFeedbackPedagogico(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setEntregaACalificar(null)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  <i className="bx bx-save"></i> Guardar Calificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AulaActivaDocenteView;

