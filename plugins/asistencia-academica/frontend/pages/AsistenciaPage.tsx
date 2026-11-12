import React, { useState } from 'react';
import AppLayout from '../../../../frontend/src/components/layout/AppLayout';
import { useAuth } from '../../../../frontend/src/contexts/AuthContext';
import styles from '../styles/asistencia.module.css';

import AsistenciaDocenteView from '../components/AsistenciaDocenteView';
import AsistenciaAlumnoView from '../components/AsistenciaAlumnoView';
import AsistenciaAdminView from '../components/AsistenciaAdminView';

export const AsistenciaPage: React.FC = () => {
  const { user } = useAuth();
  const [adminTab, setAdminTab] = useState<'docente' | 'institucional'>('docente');

  if (!user) return null;

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* ── Header Principal del Plugin ── */}
        <div className={styles.headerWrapper}>
          <div>
            <div className={styles.headerTitleBox}>
              <div className={styles.headerIcon}>
                <i className="bx bx-calendar-check"></i>
              </div>
              <h1 className={styles.headerTitle}>
                {user.rol === 'alumno'
                  ? 'Mi Asistencia y Regularidad'
                  : user.rol === 'preceptor'
                  ? 'Preceptoría — Asistencias y Actas'
                  : 'Control de Asistencia Escolar'}
              </h1>
            </div>
            <p className={styles.headerSubtitle}>
              {user.rol === 'alumno'
                ? 'Monitorea tu porcentaje de presentismo oficial y el estado de regularidad por materia'
                : 'Registro ágil de presentismo, actas de novedades y seguimiento pedagógico oficial'}
            </p>
          </div>

          {/* Selector de pestañas exclusivo para Administradores */}
          {user.rol === 'admin' && (
            <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.7)', padding: '0.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                onClick={() => setAdminTab('docente')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: adminTab === 'docente' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                  color: adminTab === 'docente' ? '#f8fafc' : '#94a3b8',
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="bx bx-edit" style={{ marginRight: '0.35rem' }}></i> Planilla de Carga
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('institucional')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: adminTab === 'institucional' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                  color: adminTab === 'institucional' ? '#f8fafc' : '#94a3b8',
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="bx bx-bar-chart-alt" style={{ marginRight: '0.35rem' }}></i> Telemetría Institucional
              </button>
            </div>
          )}
        </div>

        {/* ── Renderizado Dinámico por Rol ── */}
        {(user.rol === 'profesor' || user.rol === 'preceptor') && <AsistenciaDocenteView />}
        {user.rol === 'alumno' && <AsistenciaAlumnoView />}
        {user.rol === 'admin' && (
          adminTab === 'docente' ? <AsistenciaDocenteView /> : <AsistenciaAdminView />
        )}
      </div>
    </AppLayout>
  );
};

export default AsistenciaPage;

