/**
 * ============================================================================
 * PÁGINA PRINCIPAL: MÓDULO DE PRECEPTORÍA (EduTech Preceptoría)
 * ============================================================================
 * 
 * Rol arquitectónico:
 * Es el contenedor maestro y despachador de vistas del plugin de Preceptoría.
 * Implementa una matriz de navegación condicional basada en el rol del usuario:
 * 
 * 1. Alumno:
 *    - Renderiza directamente 'AsistenciasAlumnoView' (su propio registro de asistencia,
 *      estadísticas personales, cálculo de regularidad y estado).
 * 
 * 2. Profesor:
 *    - Renderiza 'AsistenciasDocenteView' (su registro de asistencia institucional).
 * 
 * 3. Preceptor:
 *    - Acceso a comisiones asignadas oficialmente.
 *    - Pestañas: Alumnos, Rendimiento, Constancias, Toma de Asistencia, Historial y Estadísticas.
 * 
 * 4. Administrador:
 *    - Visión global de todas las clases y comisiones del establecimiento.
 *    - Gestión de asignaciones de preceptores y asistencias del cuerpo docente.
 * 
 * Ciclo de vida:
 * - Al montar o cambiar de rol, consulta `PreceptoriaAPI.getMisClases()` para obtener
 *   las comisiones disponibles y preseleccionar la primera activa.
 */

import React, { useState, useEffect } from 'react';
import AppLayout from '../../../../frontend/src/components/layout/AppLayout';
import { useAuth } from '../../../../frontend/src/contexts/AuthContext';
import styles from '../styles/preceptoria.module.css';

import PreceptoriaAPI, { type ClasePreceptorOption } from '../services/preceptoria_api';
import PreceptoriaTomaAsistenciaView from '../components/PreceptoriaTomaAsistenciaView';
import PreceptoriaHistorialView from '../components/PreceptoriaHistorialView';
import PreceptoriaEstadisticasView from '../components/PreceptoriaEstadisticasView';
import PreceptoriaAdminAsignacionesView from '../components/PreceptoriaAdminAsignacionesView';
import AsistenciasAlumnoView from '../components/AsistenciasAlumnoView';
import PreceptoriaAlumnosView from '../components/PreceptoriaAlumnosView';
import PreceptoriaRendimientoClasesView from '../components/PreceptoriaRendimientoClasesView';
import PreceptoriaConstanciasView from '../components/PreceptoriaConstanciasView';
import AsistenciasDocenteView from '../components/AsistenciasDocenteView';
import AdminAsistenciasDocentesView from '../components/AdminAsistenciasDocentesView';

export const PreceptoriaPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'alumnos' | 'rendimiento' | 'constancias' | 'docentes' | 'toma' | 'historial' | 'estadisticas' | 'admin'>('alumnos');
  const [clases, setClases] = useState<ClasePreceptorOption[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  if (!user) return null;

  // Detección de roles del usuario actual
  const esAlumno = user.rol === 'alumno';
  const esProfesor = user.rol === 'profesor';
  const esPreceptor = user.rol === 'preceptor';
  const esAdmin = user.rol === 'admin' || Boolean(user.isAdmin);

  /**
   * Efecto para cargar comisiones según el rol con facultades de gestión (Preceptor / Admin)
   */
  useEffect(() => {
    if (esPreceptor) {
      cargarClases();
    } else if (esAdmin) {
      cargarClases();
    } else {
      setLoading(false);
    }
  }, [user.rol]);

  /**
   * Solicita al backend la lista de comisiones autorizadas para el preceptor o admin
   */
  const cargarClases = async () => {
    try {
      setLoading(true);
      const data = await PreceptoriaAPI.getMisClases();
      setClases(data);
      if (data.length > 0) {
        setClaseSeleccionada(data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar comisiones de preceptoría:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Cabecera Principal */}
        <div className={styles.headerWrapper}>
          <div className={styles.headerTitleBox}>
            <div className={styles.headerIcon}>
              <i className={`bx ${esAlumno ? 'bx-calendar-check' : esProfesor ? 'bx-briefcase-alt' : 'bx-id-card'}`}></i>
            </div>
            <div>
              <h1 className={styles.headerTitle}>
                {esAlumno
                  ? 'Asistencias — Registro Oficial'
                  : esProfesor
                  ? 'Asistencia Laboral — Registro Personal'
                  : 'Panel de Preceptoría & Asistencias'}
              </h1>
              <p className={styles.headerSubtitle}>
                {esAlumno
                  ? 'Consulta informativa de presentismo escolar, condición de regularidad y solicitudes de constancias'
                  : esProfesor
                  ? 'Consulta de cumplimiento de asistencia laboral, porcentajes y justificaciones registradas'
                  : esPreceptor
                  ? 'Gestión académica institucional: alumnos, rendimiento de comisiones, constancias, toma de asistencia y personal docente'
                  : 'Supervisión directiva institucional de preceptoría, comisiones y personal docente'}
              </p>
            </div>
          </div>

          {/* Selector de Pestañas (Solo Preceptor y Administrador) */}
          {(esPreceptor || esAdmin) && (
            <div className={styles.tabsBar} style={{ borderBottom: 'none' }}>
              <button
                type="button"
                className={`${styles.tabBtn} ${tab === 'alumnos' ? styles.tabActive : ''}`}
                onClick={() => setTab('alumnos')}
              >
                <i className="bx bx-group"></i> Nómina de Alumnos
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${tab === 'rendimiento' ? styles.tabActive : ''}`}
                onClick={() => setTab('rendimiento')}
              >
                <i className="bx bx-line-chart"></i> Rendimiento por Comisión
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${tab === 'constancias' ? styles.tabActive : ''}`}
                onClick={() => setTab('constancias')}
              >
                <i className="bx bx-file-blank"></i> Constancias de Regularidad
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${tab === 'docentes' ? styles.tabActive : ''}`}
                onClick={() => setTab('docentes')}
              >
                <i className="bx bx-briefcase-alt"></i> Asistencia Docente
              </button>

              {esPreceptor && (
                <>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${tab === 'toma' ? styles.tabActive : ''}`}
                    onClick={() => setTab('toma')}
                  >
                    <i className="bx bx-edit"></i> Toma Diaria
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
                    <i className="bx bx-pie-chart-alt-2"></i> Métricas Presentismo
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
          )}
        </div>

        {/* ── 1. VISTA EXCLUSIVA PARA ALUMNOS (INFORMATIVA) ─────────────────────────── */}
        {esAlumno && (
          <AsistenciasAlumnoView />
        )}

        {/* ── 2. VISTAS DEL PANEL DE PRECEPTORÍA Y ADMINISTRADOR ────────────────────── */}
        {(esPreceptor || esAdmin) && (
          <>
            {tab === 'alumnos' && (
              <PreceptoriaAlumnosView clases={clases} />
            )}

            {tab === 'rendimiento' && (
              <PreceptoriaRendimientoClasesView />
            )}

            {tab === 'constancias' && (
              <PreceptoriaConstanciasView />
            )}

            {tab === 'docentes' && (
              <AdminAsistenciasDocentesView />
            )}

            {esPreceptor && tab === 'toma' && (
              loading ? (
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
                  <PreceptoriaTomaAsistenciaView
                    claseId={claseSeleccionada}
                    clases={clases}
                    onClaseChange={(id) => setClaseSeleccionada(id)}
                  />
                )
              )
            )}

            {esPreceptor && tab === 'historial' && (
              claseSeleccionada ? (
                <PreceptoriaHistorialView claseId={claseSeleccionada} />
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  Selecciona una comisión para consultar su historial.
                </div>
              )
            )}

            {esPreceptor && tab === 'estadisticas' && (
              claseSeleccionada ? (
                <PreceptoriaEstadisticasView claseId={claseSeleccionada} />
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  Selecciona una comisión para consultar sus estadísticas.
                </div>
              )
            )}

            {esAdmin && tab === 'admin' && (
              <PreceptoriaAdminAsignacionesView />
            )}
          </>
        )}

        {/* ── 3. VISTA EXCLUSIVA PARA PROFESORES (ASISTENCIA LABORAL PERSONAL) ──── */}
        {esProfesor && (
          <AsistenciasDocenteView />
        )}

        {/* Mensaje de cortesía para roles no reconocidos si existieran */}
        {!esAlumno && !esProfesor && !esPreceptor && !esAdmin && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <i className="bx bx-calendar-check" style={{ fontSize: '3rem', color: '#38bdf8', marginBottom: '1rem' }}></i>
            <h2 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>Módulo de Preceptoría Escolar</h2>
            <p>La toma y certificación de asistencias es gestionada por el personal de Preceptoría.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PreceptoriaPage;
