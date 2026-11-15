import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import styles from '../componentes/aula-activa/aula_activa.module.css';

import AulaActivaDocenteView from '../componentes/aula-activa/AulaActivaDocenteView';
import AulaActivaAlumnoView from '../componentes/aula-activa/AulaActivaAlumnoView';

export const AulaActiva: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AppLayout>
      <div className={styles.container}>
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

        {user.rol === 'alumno' ? (
          <AulaActivaAlumnoView />
        ) : (
          <AulaActivaDocenteView />
        )}
      </div>
    </AppLayout>
  );
};

export default AulaActiva;

