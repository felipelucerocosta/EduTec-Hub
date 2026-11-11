import React, { useState, useEffect } from 'react';
import { AsistenciaAPI, type ResumenMateriaAlumno, type DetalleClaseAlumno } from '../services/asistencia_api';
import styles from '../styles/asistencia.module.css';
import { useToast } from '../../../../frontend/src/contexts/ToastContext';

export const AsistenciaAlumnoView: React.FC = () => {
  const { showToast } = useToast();
  const [resumen, setResumen] = useState<ResumenMateriaAlumno[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<DetalleClaseAlumno[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState<boolean>(false);

  useEffect(() => {
    async function loadResumen() {
      try {
        setLoading(true);
        const data = await AsistenciaAPI.getResumenAlumno();
        setResumen(data);
      } catch (err: any) {
        showToast(err.message || 'Error al cargar regularidad', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadResumen();
  }, [showToast]);

  const handleVerDetalle = async (claseId: number) => {
    if (selectedClaseId === claseId) {
      setSelectedClaseId(null);
      return;
    }

    try {
      setSelectedClaseId(claseId);
      setLoadingDetalle(true);
      const data = await AsistenciaAPI.getDetalleAlumnoClase(claseId);
      setDetalle(data);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar detalle de fechas', 'error');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const getRegularityBadge = (estado: 'REGULAR' | 'EN_RIESGO' | 'CRITICO') => {
    switch (estado) {
      case 'REGULAR':
        return <span className={`${styles.badge} ${styles.badgeRegular}`}><i className="bx bx-check-circle"></i> Regular (≥ 75%)</span>;
      case 'EN_RIESGO':
        return <span className={`${styles.badge} ${styles.badgeEnRiesgo}`}><i className="bx bx-error-circle"></i> En Riesgo (65%-74%)</span>;
      case 'CRITICO':
        return <span className={`${styles.badge} ${styles.badgeCritico}`}><i className="bx bx-x-circle"></i> Riesgo de Libre (&lt; 65%)</span>;
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 75) return 'linear-gradient(90deg, #059669, #34d399)';
    if (pct >= 65) return 'linear-gradient(90deg, #d97706, #fbbf24)';
    return 'linear-gradient(90deg, #dc2626, #f87171)';
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem', color: '#7c3aed' }}></i>
          <p style={{ marginTop: '0.5rem' }}>Cargando regularidad académica...</p>
        </div>
      ) : resumen.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(10,14,23,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <i className="bx bx-book-open" style={{ fontSize: '2.5rem', color: '#64748b' }}></i>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", color: '#f8fafc', marginTop: '0.5rem' }}>Sin materias inscriptas</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Únete a una comisión mediante el código de clase para registrar asistencias.</p>
        </div>
      ) : (
        <div className={styles.materiaGrid}>
          {resumen.map((mat) => (
            <div key={mat.claseId} className={styles.materiaCard}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    {mat.seccion || 'División'} · {mat.aula || 'Aula S/D'}
                  </span>
                  {getRegularityBadge(mat.estadoRegularidad)}
                </div>

                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.25rem' }}>
                  {mat.nombre}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>{mat.materia}</p>

                {/* Porcentaje y barra de progreso */}
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#94a3b8' }}>Presentismo acumulado</span>
                    <strong style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.3rem', color: mat.porcentaje >= 75 ? '#34d399' : mat.porcentaje >= 65 ? '#fbbf24' : '#f87171' }}>
                      {mat.porcentaje}%
                    </strong>
                  </div>

                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${mat.porcentaje}%`,
                        background: getProgressColor(mat.porcentaje),
                      }}
                    />
                  </div>
                </div>

                {/* Desglose numérico */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '1rem', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.025)', padding: '0.5rem', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b' }}>Clases</span>
                    <strong style={{ color: '#f8fafc' }}>{mat.totalClases}</strong>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.06)', padding: '0.5rem', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#34d399' }}>Presente</span>
                    <strong style={{ color: '#34d399' }}>{mat.presentes}</strong>
                  </div>
                  <div style={{ background: 'rgba(244,63,94,0.06)', padding: '0.5rem', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#f87171' }}>Faltas</span>
                    <strong style={{ color: '#f87171' }}>{mat.ausentes}</strong>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.06)', padding: '0.5rem', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#fbbf24' }}>Tardes</span>
                    <strong style={{ color: '#fbbf24' }}>{mat.tardes}</strong>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleVerDetalle(mat.claseId)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: selectedClaseId === mat.claseId ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                    color: selectedClaseId === mat.claseId ? '#c4b5fd' : '#cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <i className={`bx ${selectedClaseId === mat.claseId ? 'bx-chevron-up' : 'bx-list-ul'}`}></i>
                  {selectedClaseId === mat.claseId ? 'Ocultar fechas' : 'Ver detalle de fechas'}
                </button>

                {/* Desplegable de fechas */}
                {selectedClaseId === mat.claseId && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                    {loadingDetalle ? (
                      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>Cargando fechas...</p>
                    ) : detalle.length === 0 ? (
                      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>No hay registros de asistencia aún.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                        {detalle.map((d, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.78rem',
                              padding: '0.35rem 0.5rem',
                              background: 'rgba(255,255,255,0.02)',
                              borderRadius: '6px',
                            }}
                          >
                            <span style={{ color: '#cbd5e1' }}>{d.fecha}</span>
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  d.estado === 'PRESENTE'
                                    ? '#34d399'
                                    : d.estado === 'AUSENTE'
                                    ? '#f87171'
                                    : d.estado === 'TARDE'
                                    ? '#fbbf24'
                                    : '#38bdf8',
                              }}
                            >
                              {d.estado || 'S/D'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AsistenciaAlumnoView;

