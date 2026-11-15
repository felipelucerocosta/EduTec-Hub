import React, { useState, useEffect } from 'react';
import OportunidadesAPI, { type OportunidadItem } from '../services/oportunidades_api';
import styles from '../styles/oportunidades.module.css';

interface Props {
  esAlumno: boolean;
  onPostulacionExitosa?: () => void;
}

export const OportunidadesExplorarView: React.FC<Props> = ({ esAlumno, onPostulacionExitosa }) => {
  const [oportunidades, setOportunidades] = useState<OportunidadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('todas');
  const [modalidad, setModalidad] = useState<string>('todas');

  // Modal Detalle / Postulación
  const [opSeleccionada, setOpSeleccionada] = useState<OportunidadItem | null>(null);
  const [modalPostular, setModalPostular] = useState<boolean>(false);
  const [presentacion, setPresentacion] = useState<string>('');
  const [motivacion, setMotivacion] = useState<string>('');
  const [conocimientos, setConocimientos] = useState<string>('');
  const [disponibilidad, setDisponibilidad] = useState<string>('10 hs semanales');
  const [enviando, setEnviando] = useState<boolean>(false);

  useEffect(() => {
    cargarOportunidades();
  }, [categoria, modalidad]);

  const cargarOportunidades = async () => {
    try {
      setLoading(true);
      const data = await OportunidadesAPI.listarOportunidades({
        categoria: categoria !== 'todas' ? categoria : undefined,
        modalidad: modalidad !== 'todas' ? modalidad : undefined,
        busqueda: busqueda.trim() || undefined,
        estado: 'abierta',
      });
      setOportunidades(data);
    } catch (err) {
      console.error('Error al cargar convocatorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarOportunidades();
  };

  const handleEnviarPostulacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opSeleccionada) return;

    try {
      setEnviando(true);
      await OportunidadesAPI.postularse(opSeleccionada.id, {
        presentacion,
        motivacion,
        conocimientos_previos: conocimientos,
        disponibilidad,
      });
      alert('¡Postulación enviada exitosamente! Se notificó al responsable de la institución.');
      setModalPostular(false);
      setPresentacion('');
      setMotivacion('');
      setConocimientos('');
      if (onPostulacionExitosa) onPostulacionExitosa();
      cargarOportunidades();
    } catch (err: any) {
      alert(err.message || 'Error al postularse');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Barra de Búsqueda y Filtros */}
      <form onSubmit={handleBuscar} className={styles.filtersBar}>
        <div className={styles.filterInputsGroup}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por proyecto, palabra clave o institución..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            className={styles.selectFilter}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            <option value="desarrollo_software">Desarrollo de Software</option>
            <option value="robotica_automatizacion">Robótica y Automatización</option>
            <option value="redes_telecomunicaciones">Redes y Telecomunicaciones</option>
            <option value="inteligencia_artificial">Inteligencia Artificial</option>
            <option value="investigacion_cientifica">Investigación Científica</option>
            <option value="innovacion_tecnologica">Innovación Tecnológica</option>
          </select>

          <select
            className={styles.selectFilter}
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
          >
            <option value="todas">Todas las modalidades</option>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
            <option value="hibrida">Híbrida</option>
          </select>
        </div>

        <button type="submit" className={styles.primaryBtn}>
          <i className="bx bx-search"></i> Filtrar
        </button>
      </form>

      {/* Grid de Convocatorias */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
          <p>Explorando oportunidades...</p>
        </div>
      ) : oportunidades.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <i className="bx bx-bulb" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
          <p>No se encontraron convocatorias abiertas con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {oportunidades.map((op) => {
            const vacantesDisponibles = op.vacantes_totales - op.vacantes_ocupadas;
            const tieneVacantes = vacantesDisponibles > 0;

            return (
              <div key={op.id} className={styles.opportunityCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.institutionTag}>
                      <i className="bx bx-buildings"></i> {op.institucion}
                    </span>
                    <h3 className={styles.cardTitle}>{op.titulo}</h3>
                  </div>
                  <span className={`${styles.badge} ${tieneVacantes ? styles.badgeSuccess : styles.badgeDanger}`}>
                    {tieneVacantes ? `${vacantesDisponibles} vacantes` : 'Completa'}
                  </span>
                </div>

                <p className={styles.cardDesc}>{op.descripcion}</p>

                <div className={styles.infoRow}>
                  <span className={styles.infoChip}>
                    <i className="bx bx-map-pin"></i> {op.modalidad.toUpperCase()}
                  </span>
                  <span className={styles.infoChip}>
                    <i className="bx bx-category"></i> {op.tipo_oportunidad}
                  </span>
                  {op.duracion && (
                    <span className={styles.infoChip}>
                      <i className="bx bx-time"></i> {op.duracion}
                    </span>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <span>
                    <i className="bx bx-calendar-x" style={{ marginRight: '0.25rem' }}></i>
                    Cierre: {new Date(op.fecha_cierre_inscripcion).toLocaleDateString()}
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setOpSeleccionada(op)}
                    >
                      Ver Detalle
                    </button>
                    {esAlumno && tieneVacantes && (
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => {
                          setOpSeleccionada(op);
                          setModalPostular(true);
                        }}
                      >
                        <i className="bx bx-send"></i> Postularme
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalle Completo */}
      {opSeleccionada && !modalPostular && (
        <div className={styles.modalOverlay} onClick={() => setOpSeleccionada(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className={styles.institutionTag}>{opSeleccionada.institucion}</span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.2rem 0 0 0' }}>
                  {opSeleccionada.titulo}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpSeleccionada(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <div>
                <strong style={{ color: '#f8fafc' }}>Descripción del Proyecto:</strong>
                <p style={{ margin: '0.25rem 0' }}>{opSeleccionada.descripcion}</p>
              </div>

              {opSeleccionada.requisitos && (
                <div>
                  <strong style={{ color: '#f8fafc' }}>Requisitos y perfil solicitado:</strong>
                  <p style={{ margin: '0.25rem 0' }}>{opSeleccionada.requisitos}</p>
                </div>
              )}

              {opSeleccionada.conocimientos && (
                <div>
                  <strong style={{ color: '#f8fafc' }}>Tecnologías / Conocimientos:</strong>
                  <p style={{ margin: '0.25rem 0' }}>{opSeleccionada.conocimientos}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(30, 41, 59, 0.5)', padding: '0.85rem', borderRadius: '8px' }}>
                <div><strong>Modalidad:</strong> {opSeleccionada.modalidad}</div>
                <div><strong>Vacantes Disponibles:</strong> {opSeleccionada.vacantes_totales - opSeleccionada.vacantes_ocupadas} de {opSeleccionada.vacantes_totales}</div>
                <div><strong>Fecha de Cierre:</strong> {new Date(opSeleccionada.fecha_cierre_inscripcion).toLocaleDateString()}</div>
                <div><strong>Contacto Oficial:</strong> {opSeleccionada.contacto_email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setOpSeleccionada(null)}>
                Cerrar
              </button>
              {esAlumno && (opSeleccionada.vacantes_totales - opSeleccionada.vacantes_ocupadas > 0) && (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => setModalPostular(true)}
                >
                  <i className="bx bx-send"></i> Inscribirme Ahora
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulario de Postulación Alumno */}
      {modalPostular && opSeleccionada && (
        <div className={styles.modalOverlay} onClick={() => setModalPostular(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Postulación: {opSeleccionada.titulo}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Institución: {opSeleccionada.institucion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalPostular(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEnviarPostulacion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Presentación Personal y Trayectoria</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Comenta brevemente tu perfil, especialidad y experiencias..."
                  value={presentacion}
                  onChange={(e) => setPresentacion(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>¿Por qué te interesa esta oportunidad? (Motivación) *</label>
                <textarea
                  required
                  className={styles.formTextarea}
                  placeholder="Detalla tu interés en participar del proyecto o pasantía..."
                  value={motivacion}
                  onChange={(e) => setMotivacion(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Conocimientos o Proyectos Previos relacionados</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Ej: Lenguajes que manejas, circuitos, herramientas que dominas..."
                  value={conocimientos}
                  onChange={(e) => setConocimientos(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Disponibilidad Horaria</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={disponibilidad}
                  onChange={(e) => setDisponibilidad(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setModalPostular(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={enviando}>
                  {enviando ? (
                    <>
                      <i className="bx bx-loader-alt bx-spin"></i> Registrando...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-check-circle"></i> Confirmar Postulación
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

export default OportunidadesExplorarView;

