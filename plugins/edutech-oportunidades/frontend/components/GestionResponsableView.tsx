import React, { useState, useEffect } from 'react';
import OportunidadesAPI, { type OportunidadItem, type PostulacionItem, type MetricasResponsable } from '../services/oportunidades_api';
import { useAuth } from '../../../../frontend/src/contexts/AuthContext';
import styles from '../styles/oportunidades.module.css';

export const GestionResponsableView: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [oportunidades, setOportunidades] = useState<OportunidadItem[]>([]);
  const [metricas, setMetricas] = useState<MetricasResponsable | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Nueva Oportunidad
  const [modalCrear, setModalCrear] = useState<boolean>(false);
  const [titulo, setTitulo] = useState<string>('');
  const [institucion, setInstitucion] = useState<string>('E.E.S.T. N° 29');
  const [descripcion, setDescripcion] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('desarrollo_software');
  const [tipoOportunidad, setTipoOportunidad] = useState<string>('pasantia');
  const [requisitos, setRequisitos] = useState<string>('');
  const [conocimientos, setConocimientos] = useState<string>('');
  const [vacantesTotales, setVacantesTotales] = useState<number>(2);
  const [fechaCierre, setFechaCierre] = useState<string>('');
  const [modalidad, setModalidad] = useState<string>('presencial');
  const [contactoEmail, setContactoEmail] = useState<string>('felipelucero534@gmail.com');

  // Modal Postulantes de una Convocatoria
  const [opSeleccionada, setOpSeleccionada] = useState<OportunidadItem | null>(null);
  const [postulantes, setPostulantes] = useState<PostulacionItem[]>([]);
  const [loadingPostulantes, setLoadingPostulantes] = useState<boolean>(false);

  // Modal Evaluar Postulante
  const [postulanteAEvaluar, setPostulanteAEvaluar] = useState<PostulacionItem | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>('aceptada');
  const [notasResponsable, setNotasResponsable] = useState<string>('');

  useEffect(() => {
    if (!authLoading) {
      cargarDatos();
    }
  }, [authLoading]);

  // Si el usuario tiene un email cargado en su perfil, inicializamos contactoEmail con el suyo si no se ha modificado
  useEffect(() => {
    if (user?.correo && (!contactoEmail || contactoEmail === 'felipelucero534@gmail.com')) {
      setContactoEmail(user.correo);
    }
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ops, m] = await Promise.all([
        OportunidadesAPI.listarOportunidades({}),
        OportunidadesAPI.getMetricas().catch(() => null),
      ]);
      setOportunidades(ops);
      setMetricas(m);
    } catch (err: any) {
      console.error('Error al cargar gestión responsable:', err);
      setError(err?.message || 'Error de conexión al cargar las convocatorias.');
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !institucion.trim() || !descripcion.trim() || !fechaCierre) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      await OportunidadesAPI.crearOportunidad({
        titulo,
        institucion,
        descripcion,
        categoria,
        tipo_oportunidad: tipoOportunidad,
        requisitos,
        conocimientos,
        vacantes_totales: vacantesTotales,
        fecha_cierre_inscripcion: fechaCierre,
        modalidad,
        contacto_email: contactoEmail || undefined,
      });
      setModalCrear(false);
      setTitulo('');
      setDescripcion('');
      setRequisitos('');
      setConocimientos('');
      setFechaCierre('');
      cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al crear convocatoria');
    }
  };

  const abrirPostulantes = async (op: OportunidadItem) => {
    setOpSeleccionada(op);
    setLoadingPostulantes(true);
    try {
      const list = await OportunidadesAPI.verPostulantes(op.id);
      setPostulantes(list);
    } catch (err) {
      console.error('Error al cargar postulantes:', err);
    } finally {
      setLoadingPostulantes(false);
    }
  };

  const handleEvaluar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postulanteAEvaluar) return;

    try {
      await OportunidadesAPI.actualizarEstadoPostulacion(postulanteAEvaluar.id, nuevoEstado, notasResponsable);
      setPostulanteAEvaluar(null);
      setNotasResponsable('');
      if (opSeleccionada) {
        abrirPostulantes(opSeleccionada);
      }
      cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado');
    }
  };

  if (authLoading || (loading && oportunidades.length === 0 && !error)) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
        <p>Cargando panel de gestión...</p>
      </div>
    );
  }

  if (error && oportunidades.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
        <i className="bx bx-error-circle" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
        <p style={{ fontWeight: 600 }}>{error}</p>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          Verifica que el servidor backend esté en ejecución e intenta nuevamente.
        </p>
        <button
          type="button"
          className={styles.primaryBtn}
          style={{ marginTop: '1rem' }}
          onClick={() => cargarDatos()}
        >
          <i className="bx bx-refresh"></i> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Botón de Publicación y Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
          Convocatorias Institucionales
        </h2>

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => setModalCrear(true)}
        >
          <i className="bx bx-plus-circle"></i> Publicar Nueva Oportunidad
        </button>
      </div>

      {/* Métricas del Responsable */}
      {metricas && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <i className="bx bx-briefcase"></i>
            </div>
            <div>
              <div className={styles.metricValue}>{metricas.totalOportunidades}</div>
              <div className={styles.metricLabel}>Convocatorias</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <i className="bx bx-user-pin"></i>
            </div>
            <div>
              <div className={styles.metricValue}>{metricas.totalPostulaciones}</div>
              <div className={styles.metricLabel}>Postulaciones Recibidas</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <i className="bx bx-time"></i>
            </div>
            <div>
              <div className={styles.metricValue}>{metricas.pendientes}</div>
              <div className={styles.metricLabel}>Por Evaluar</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <i className="bx bx-check-shield"></i>
            </div>
            <div>
              <div className={styles.metricValue}>{metricas.aceptadas}</div>
              <div className={styles.metricLabel}>Seleccionados</div>
            </div>
          </div>
        </div>
      )}

      {/* Listado de Oportunidades */}
      <div className={styles.cardsGrid}>
        {oportunidades.map((op) => (
          <div key={op.id} className={styles.opportunityCard}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.institutionTag}>{op.institucion}</span>
                <h3 className={styles.cardTitle}>{op.titulo}</h3>
              </div>
              <span className={`${styles.badge} ${op.estado === 'abierta' ? styles.badgeSuccess : styles.badgeDanger}`}>
                {op.estado.toUpperCase()}
              </span>
            </div>

            <p className={styles.cardDesc}>{op.descripcion}</p>

            <div className={styles.infoRow}>
              <span className={styles.infoChip}>
                <i className="bx bx-group"></i> {op.vacantes_ocupadas} / {op.vacantes_totales} vacantes ocupadas
              </span>
              <span className={styles.infoChip}>
                <i className="bx bx-map-pin"></i> {op.modalidad}
              </span>
            </div>

            <div className={styles.cardFooter}>
              <span>
                <i className="bx bx-calendar" style={{ marginRight: '0.25rem' }}></i>
                Cierre: {new Date(op.fecha_cierre_inscripcion).toLocaleDateString()}
              </span>

              <button
                type="button"
                className={styles.primaryBtn}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                onClick={() => abrirPostulantes(op)}
              >
                <i className="bx bx-user-check"></i> Postulantes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Oportunidad */}
      {modalCrear && (
        <div className={styles.modalOverlay} onClick={() => setModalCrear(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Publicar Convocatoria Institucional
              </h2>
              <button
                type="button"
                onClick={() => setModalCrear(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Título de la oportunidad / proyecto *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  placeholder="Ej: Pasantía en Desarrollo Frontend React - TechLab"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Institución u Empresa *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={institucion}
                    onChange={(e) => setInstitucion(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Correo de Notificaciones (Personal o Institucional) *</label>
                  <input
                    type="email"
                    required
                    className={styles.formInput}
                    placeholder="profesor@gmail.com o institucional"
                    value={contactoEmail}
                    onChange={(e) => setContactoEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descripción General *</label>
                <textarea
                  required
                  className={styles.formTextarea}
                  placeholder="Objetivos, tareas y beneficios para el estudiante..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Categoría</label>
                  <select
                    className={styles.formSelect}
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option value="desarrollo_software">Desarrollo de Software</option>
                    <option value="robotica_automatizacion">Robótica y Automatización</option>
                    <option value="redes_telecomunicaciones">Redes y Telecomunicaciones</option>
                    <option value="inteligencia_artificial">Inteligencia Artificial</option>
                    <option value="investigacion_cientifica">Investigación Científica</option>
                    <option value="innovacion_tecnologica">Innovación Tecnológica</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Modalidad</label>
                  <select
                    className={styles.formSelect}
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                  >
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                    <option value="hibrida">Híbrida</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vacantes Totales *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className={styles.formInput}
                    value={vacantesTotales}
                    onChange={(e) => setVacantesTotales(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Fecha Límite de Inscripción *</label>
                  <input
                    type="date"
                    required
                    className={styles.formInput}
                    value={fechaCierre}
                    onChange={(e) => setFechaCierre(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tipo de Oportunidad</label>
                  <select
                    className={styles.formSelect}
                    value={tipoOportunidad}
                    onChange={(e) => setTipoOportunidad(e.target.value)}
                  >
                    <option value="pasantia">Pasantía Profesional</option>
                    <option value="proyecto_tecnologico">Proyecto Tecnológico</option>
                    <option value="investigacion">Investigación</option>
                    <option value="concurso_competencia">Concurso / Competencia</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Requisitos y Perfil</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Requisitos académicos o de año..."
                  value={requisitos}
                  onChange={(e) => setRequisitos(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setModalCrear(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  <i className="bx bx-check"></i> Publicar Convocatoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lista de Postulantes */}
      {opSeleccionada && (
        <div className={styles.modalOverlay} onClick={() => setOpSeleccionada(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Postulantes: {opSeleccionada.titulo}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Vacantes ocupadas: {opSeleccionada.vacantes_ocupadas} / {opSeleccionada.vacantes_totales}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpSeleccionada(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {loadingPostulantes ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '1.5rem' }}></i>
                <p>Cargando postulantes...</p>
              </div>
            ) : postulantes.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>
                No se han registrado postulaciones para esta convocatoria hasta el momento.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {postulantes.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                          {post.alumno_nombre}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                          <i className="bx bx-envelope"></i> {post.alumno_correo}
                          {post.alumno_dni && ` | DNI: ${post.alumno_dni}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={`${styles.badge} ${post.estado === 'aceptada' ? styles.badgeSuccess : styles.badgeWarning}`}>
                          {post.estado.toUpperCase()}
                        </span>

                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                          onClick={() => {
                            setPostulanteAEvaluar(post);
                            setNuevoEstado(post.estado);
                            setNotasResponsable(post.notas_responsable || '');
                          }}
                        >
                          <i className="bx bx-edit"></i> Evaluar
                        </button>
                      </div>
                    </div>

                    {post.motivacion && (
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.5)', padding: '0.5rem', borderRadius: '6px' }}>
                        <strong>Motivación:</strong> {post.motivacion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Evaluar Postulante */}
      {postulanteAEvaluar && (
        <div className={styles.modalOverlay} onClick={() => setPostulanteAEvaluar(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Evaluar a {postulanteAEvaluar.alumno_nombre}
              </h2>
              <button
                type="button"
                onClick={() => setPostulanteAEvaluar(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEvaluar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado de la Postulación</label>
                <select
                  className={styles.formSelect}
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  <option value="pendiente">Pendiente de Revisión</option>
                  <option value="en_evaluacion">En Evaluación</option>
                  <option value="entrevista">Convocado a Entrevista</option>
                  <option value="aceptada">Aceptado / Seleccionado (Ocupa vacante)</option>
                  <option value="rechazada">No Seleccionado</option>
                  <option value="lista_espera">Lista de Espera</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Devolución / Notas para el Estudiante</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Detalla instrucciones para entrevista, fechas o motivo de la selección..."
                  value={notasResponsable}
                  onChange={(e) => setNotasResponsable(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setPostulanteAEvaluar(null)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  <i className="bx bx-save"></i> Guardar Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionResponsableView;

