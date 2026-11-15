import React, { useState, useEffect } from 'react';
import AppLayout from '../../../../frontend/src/components/layout/AppLayout';
import { useAuth } from '../../../../frontend/src/contexts/AuthContext';
import styles from '../styles/preceptoria.module.css';

import PreceptoriaAPI, { type ClasePreceptorOption } from '../services/preceptoria_api';
import PreceptoriaTomaAsistenciaView from '../components/PreceptoriaTomaAsistenciaView';
import PreceptoriaHistorialView from '../components/PreceptoriaHistorialView';
import PreceptoriaEstadisticasView from '../components/PreceptoriaEstadisticasView';
import PreceptoriaAdminAsignacionesView from '../components/PreceptoriaAdminAsignacionesView';

export const PreceptoriaPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'toma' | 'historial' | 'estadisticas' | 'admin'>('toma');
  const [clases, setClases] = useState<ClasePreceptorOption[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  if (!user) return null;

  const esPreceptor = user.rol === 'preceptor';
  const esAdmin = user.rol === 'admin' || Boolean(user.isAdmin);

  useEffect(() => {
    if (esPreceptor) {
      cargarClases();
    } else if (esAdmin) {
      setTab('admin');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user.rol]);

  const cargarClases = async () => {
    try {
      setLoading(true);
      const data = await PreceptoriaAPI.getMisClases();
      setClases(data);
      if (data.length > 0) {
        setClaseSeleccionada(data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar clases de preceptoría:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.headerWrapper}>
          <div className={styles.headerTitleBox}>
            <div className={styles.headerIcon}>
              <i className="bx bx-calendar-check"></i>
            </div>
            <div>
              <h1 className={styles.headerTitle}>Preceptoría — Toma de Asistencia</h1>
              <p className={styles.headerSubtitle}>
                {esPreceptor
                  ? 'Registro exclusivo de presentismo escolar para comisiones asignadas'
                  : 'Gestión institucional de asignaciones de preceptores a comisiones'}
              </p>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className={styles.tabsBar} style={{ borderBottom: 'none' }}>
            {esPreceptor && (
              <>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${tab === 'toma' ? styles.tabActive : ''}`}
                  onClick={() => setTab('toma')}
                >
                  <i className="bx bx-edit"></i> Toma de Asistencia
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${tab === 'historial' ? styles.tabActive : ''}`}
                  onClick={() => setTab('historial')}
                >
                  <i className="bx bx-history"></i> Historial
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${tab === 'estadisticas' ? styles.tabActive : ''}`}
                  onClick={() => setTab('estadisticas')}
                >
                  <i className="bx bx-bar-chart-alt-2"></i> Estadísticas
                </button>
              </>
            )}

            {esAdmin && (
              <button
                type="button"
                className={`${styles.tabBtn} ${tab === 'admin' ? styles.tabActive : ''}`}
                onClick={() => setTab('admin')}
              >
                <i className="bx bx-shield-quarter"></i> Asignación de Comisiones
              </button>
            )}
          </div>
        </div>

        {/* Mensaje para usuarios sin rol preceptor ni admin */}
        {!esPreceptor && !esAdmin && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <i className="bx bx-lock-alt" style={{ fontSize: '3rem', color: '#f87171', marginBottom: '1rem' }}></i>
            <h2 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>Módulo Restringido</h2>
            <p>La toma y modificación de asistencia está reservada exclusivamente para el personal con rol de <strong>Preceptor</strong>.</p>
          </div>
        )}

        {/* Vistas de Preceptor */}
        {esPreceptor && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
                <p>Cargando comisiones asignadas...</p>
              </div>
            ) : clases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                <i className="bx bx-folder-open" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}></i>
                <h3 style={{ color: '#cbd5e1' }}>No tienes comisiones asignadas</h3>
                <p>Solicita al Administrador Institucional que asigne las comisiones a tu cuenta de preceptor.</p>
              </div>
            ) : (
              claseSeleccionada && (
                <>
                  {tab === 'toma' && (
                    <PreceptoriaTomaAsistenciaView
                      claseId={claseSeleccionada}
                      clases={clases}
                      onClaseChange={(id) => setClaseSeleccionada(id)}
                    />
                  )}
                  {tab === 'historial' && (
                    <PreceptoriaHistorialView claseId={claseSeleccionada} />
                  )}
                  {tab === 'estadisticas' && (
                    <PreceptoriaEstadisticasView claseId={claseSeleccionada} />
                  )}
                </>
              )
            )}
          </>
        )}

        {/* Vista de Administrador */}
        {esAdmin && tab === 'admin' && (
          <PreceptoriaAdminAsignacionesView />
        )}
      </div>
    </AppLayout>
  );
};

export default PreceptoriaPage;

