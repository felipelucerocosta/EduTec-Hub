import React, { useState } from 'react';
import AppLayout from '../../../../frontend/src/components/layout/AppLayout';
import { useAuth } from '../../../../frontend/src/contexts/AuthContext';
import styles from '../styles/oportunidades.module.css';

import OportunidadesExplorarView from '../components/OportunidadesExplorarView';
import MisPostulacionesView from '../components/MisPostulacionesView';
import GestionResponsableView from '../components/GestionResponsableView';

export const OportunidadesPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'explorar' | 'mis_postulaciones' | 'gestion'>('explorar');

  if (!user) return null;

  const esAlumno = user.rol === 'alumno';
  const esResponsableOAdmin = user.rol === 'profesor' || user.rol === 'admin' || user.rol === 'preceptor';

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Header Principal del Plugin */}
        <div className={styles.headerWrapper}>
          <div className={styles.headerTitleBox}>
            <div className={styles.headerIcon}>
              <i className="bx bx-briefcase-alt-2"></i>
            </div>
            <div>
              <h1 className={styles.headerTitle}>Portal de Oportunidades</h1>
              <p className={styles.headerSubtitle}>
                Conecta con pasantías profesionales, proyectos tecnológicos, investigaciones y becas institucionales
              </p>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className={styles.tabsBar} style={{ borderBottom: 'none' }}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'explorar' ? styles.tabActive : ''}`}
              onClick={() => setTab('explorar')}
            >
              <i className="bx bx-search-alt"></i> Explorar Convocatorias
            </button>

            {esAlumno && (
              <button
                type="button"
                className={`${styles.tabBtn} ${tab === 'mis_postulaciones' ? styles.tabActive : ''}`}
                onClick={() => setTab('mis_postulaciones')}
              >
                <i className="bx bx-file"></i> Mis Postulaciones
              </button>
            )}

            {esResponsableOAdmin && (
              <button
                type="button"
                className={`${styles.tabBtn} ${tab === 'gestion' ? styles.tabActive : ''}`}
                onClick={() => setTab('gestion')}
              >
                <i className="bx bx-cog"></i> Panel de Gestión Institucional
              </button>
            )}
          </div>
        </div>

        {/* Contenido según pestaña */}
        {tab === 'explorar' && (
          <OportunidadesExplorarView
            esAlumno={esAlumno}
            onPostulacionExitosa={() => setTab('mis_postulaciones')}
          />
        )}

        {tab === 'mis_postulaciones' && esAlumno && (
          <MisPostulacionesView />
        )}

        {tab === 'gestion' && esResponsableOAdmin && (
          <GestionResponsableView />
        )}
      </div>
    </AppLayout>
  );
};

export default OportunidadesPage;

