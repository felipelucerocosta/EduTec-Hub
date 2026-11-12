import React from 'react';
import AppLayout from '../../../../frontend/src/components/layout/AppLayout';
import { useAuth } from '../../../../frontend/src/contexts/AuthContext';
import styles from '../styles/aula_activa.module.css';

import AulaActivaDocenteView from '../components/AulaActivaDocenteView';
import AulaActivaAlumnoView from '../components/AulaActivaAlumnoView';

export const AulaActivaPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Header Principal del Plugin */}
        <div className={styles.headerWrapper}>
          <div className={styles.headerTitleBox}>
            <div className={styles.headerIcon}>
              <i className="bx bx-book-open"></i>
            </div>
            <div>
              <h1 className={styles.headerTitle}>
                {user.rol === 'alumno' ? 'Aula Activa — Mis Trabajos' : 'Aula Activa — Gestión Pedagógica'}
              </h1>
              <p className={styles.headerSubtitle}>
                {user.rol === 'alumno'
                  ? 'Consulta consignas, entrega actividades y recibe retroalimentación en tiempo real'
                  : 'Publicación de consignas, recepción de entregas, calificaciones y foro pedagógico'}
              </p>
            </div>
          </div>
        </div>

        {/* Renderizado dinámico según el rol */}
        {user.rol === 'alumno' ? (
          <AulaActivaAlumnoView />
        ) : (
          <AulaActivaDocenteView />
        )}
      </div>
    </AppLayout>
  );
};

export default AulaActivaPage;

