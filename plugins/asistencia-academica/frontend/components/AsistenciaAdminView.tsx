import React, { useState, useEffect } from 'react';
import { AsistenciaAPI, type EstadisticasAdminData } from '../services/asistencia_api';
import styles from '../styles/asistencia.module.css';
import { useToast } from '../../../../frontend/src/contexts/ToastContext';

export const AsistenciaAdminView: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<EstadisticasAdminData | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const [statsRes, healthRes] = await Promise.all([
          AsistenciaAPI.getEstadisticasAdmin(),
          AsistenciaAPI.getHealth(),
        ]);
        setData(statsRes);
        setHealth(healthRes);
      } catch (err: any) {
        showToast(err.message || 'Error al cargar telemetría', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [showToast]);

  return (
    <div className={styles.container}>
      {/* ── Estado del Plugin / Health ── */}
      {health && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.25)',
          borderRadius: '12px', padding: '0.85rem 1.25rem', flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>{health.nombre} (v{health.version})</strong>
            <span style={{ fontSize: '0.75rem', color: '#a78bfa' }}>· Estado: {health.estado}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Uptime: {Math.floor(health.uptimeSegundos / 60)} min · Plugin 1 de 2 Integrado
          </span>
        </div>
      )}

      {/* ── KPIs Globales de la Institución ── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Sesiones Tomadas</span>
          <span className={styles.kpiValue} style={{ color: '#38bdf8' }}>{data?.totalSesiones || 0}</span>
          <span className={styles.kpiSubtext}>Jornadas escolares registradas</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Registros Computados</span>
          <span className={styles.kpiValue} style={{ color: '#c4b5fd' }}>{data?.totalRegistros || 0}</span>
          <span className={styles.kpiSubtext}>Asistencias individuales en DB</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Divisiones Monitoreadas</span>
          <span className={styles.kpiValue} style={{ color: '#34d399' }}>{data?.divisiones.length || 0}</span>
          <span className={styles.kpiSubtext}>Secciones con datos cargados</span>
        </div>
      </div>

      {/* ── Tabla de Divisiones y Presentismo ── */}
      <div style={{ marginTop: '0.5rem' }}>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.75rem' }}>
          Consolidado Institucional por División
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem', color: '#7c3aed' }}></i>
            <p style={{ marginTop: '0.5rem' }}>Cargando datos institucionales...</p>
          </div>
        ) : !data || data.divisiones.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(10,14,23,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <i className="bx bx-info-circle" style={{ fontSize: '2rem', color: '#64748b' }}></i>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.5rem' }}>
              Aún no se han registrado planillas de asistencia en el ciclo lectivo.
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>División / Sección</th>
                  <th>Jornadas Tomadas</th>
                  <th>Presentes</th>
                  <th>Ausentes</th>
                  <th>Tardes</th>
                  <th>Justificados</th>
                  <th>Presentismo Promedio</th>
                </tr>
              </thead>
              <tbody>
                {data.divisiones.map((div, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: '#f8fafc' }}>{div.seccion}</td>
                    <td>{div.sesiones} sesiones</td>
                    <td style={{ color: '#34d399', fontWeight: 600 }}>{div.presentes}</td>
                    <td style={{ color: '#f87171', fontWeight: 600 }}>{div.ausentes}</td>
                    <td style={{ color: '#fbbf24', fontWeight: 600 }}>{div.tardes}</td>
                    <td style={{ color: '#38bdf8', fontWeight: 600 }}>{div.justificados}</td>
                    <td>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: div.porcentaje >= 75 ? '#34d399' : div.porcentaje >= 65 ? '#fbbf24' : '#f87171'
                      }}>
                        {div.porcentaje}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsistenciaAdminView;

