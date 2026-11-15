import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, { type HistorialSesionItem } from '../services/preceptoria_api';
import styles from '../styles/preceptoria.module.css';

interface Props {
  claseId: number;
}

export const PreceptoriaHistorialView: React.FC<Props> = ({ claseId }) => {
  const [historial, setHistorial] = useState<HistorialSesionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (claseId) {
      cargarHistorial();
    }
  }, [claseId]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await PreceptoriaAPI.getHistorial(claseId);
      setHistorial(data);
    } catch (err) {
      console.error('Error al cargar historial de asistencia:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
        <p>Cargando historial de asistencias...</p>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        <i className="bx bx-calendar-x" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
        <p>No hay tomas de asistencia registradas para esta comisión aún.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
        Total de sesiones de asistencia registradas: <strong>{historial.length}</strong>
      </div>

      <div className={styles.attendanceTableWrapper}>
        <table className={styles.attendanceTable}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Preceptor Responsable</th>
              <th>Presentes</th>
              <th>Ausentes</th>
              <th>Tardes</th>
              <th>Justificados</th>
              <th>% Presentismo</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((s) => {
              const total = s.total_alumnos || 1;
              const pct = Number(((s.presentes / total) * 100).toFixed(1));

              return (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                    <i className="bx bx-calendar" style={{ marginRight: '0.35rem', color: '#38bdf8' }}></i>
                    {s.fecha}
                  </td>
                  <td style={{ color: '#cbd5e1' }}>{s.preceptor_nombre}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>{s.presentes}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeDanger}`}>{s.ausentes}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeWarning}`}>{s.tardes}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeInfo}`}>{s.justificados}</span>
                  </td>
                  <td>
                    <strong style={{ color: pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171' }}>
                      {pct}%
                    </strong>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    {s.observaciones || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreceptoriaHistorialView;

