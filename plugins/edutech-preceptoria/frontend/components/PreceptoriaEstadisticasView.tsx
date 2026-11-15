import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, { type EstadisticasPreceptoria } from '../services/preceptoria_api';
import styles from '../styles/preceptoria.module.css';

interface Props {
  claseId: number;
}

export const PreceptoriaEstadisticasView: React.FC<Props> = ({ claseId }) => {
  const [stats, setStats] = useState<EstadisticasPreceptoria | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (claseId) {
      cargarEstadisticas();
    }
  }, [claseId]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const data = await PreceptoriaAPI.getEstadisticas(claseId);
      setStats(data);
    } catch (err) {
      console.error('Error al cargar estadísticas de asistencia:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
        <p>Calculando estadísticas oficiales...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        <p>No se encontraron datos estadísticos para esta comisión.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <i className="bx bx-calendar-check"></i>
          </div>
          <div>
            <div className={styles.metricValue}>{stats.totalSesiones}</div>
            <div className={styles.metricLabel}>Jornadas Registradas</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <i className="bx bx-user-check"></i>
          </div>
          <div>
            <div className={styles.metricValue}>{stats.presentes}</div>
            <div className={styles.metricLabel}>Presentismos Totales</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <i className="bx bx-user-x"></i>
          </div>
          <div>
            <div className={styles.metricValue}>{stats.ausentes}</div>
            <div className={styles.metricLabel}>Inasistencias Registradas</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <i className="bx bx-time"></i>
          </div>
          <div>
            <div className={styles.metricValue}>{stats.tardes}</div>
            <div className={styles.metricLabel}>Llegadas Tarde</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <i className="bx bx-pie-chart-alt-2"></i>
          </div>
          <div>
            <div className={styles.metricValue}>{stats.porcentajeAsistencia}%</div>
            <div className={styles.metricLabel}>Tasa de Asistencia General</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreceptoriaEstadisticasView;

