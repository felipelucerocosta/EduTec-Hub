/**
 * ============================================================================
 * PÁGINA PRINCIPAL: PORTAL DE OPORTUNIDADES (EduTech Oportunidades)
 * ============================================================================
 * 
 * Rol arquitectónico:
 * Componente de entrada y orquestador de interfaz para el plugin de oportunidades.
 * Implementa el patrón "Tab Container" con renderizado condicional según el rol
 * del usuario autenticado (RBAC en cliente):
 * 
 * 1. Alumnos:
 *    - Pestaña 'Explorar Convocatorias': visualización y postulación a pasantías/becas.
 *    - Pestaña 'Mis Postulaciones': seguimiento en tiempo real del estado de sus aplicaciones.
 * 
 * 2. Docentes / Preceptores / Administradores:
 *    - Pestaña 'Explorar Convocatorias': catálogo institucional público.
 *    - Pestaña 'Gestión de Convocatorias': creación, edición, cierre y evaluación de postulantes.
 * 
 * Contexto y Dependencias:
 * - AppLayout: layout general del sistema institucional con barra lateral y superior.
 * - useAuth: hook de contexto que suministra el perfil y rol del usuario en sesión.
 * - Estilos: encapsulados con CSS Modules (oportunidades.module.css).
 */

import React, { useState } from 'react';
import AppLayout from '../../../../frontend/src/components/layout/AppLayout';
import { useAuth } from '../../../../frontend/src/contexts/AuthContext';
import styles from '../styles/oportunidades.module.css';

import OportunidadesExplorarView from '../components/OportunidadesExplorarView';
import MisPostulacionesView from '../components/MisPostulacionesView';
import GestionResponsableView from '../components/GestionResponsableView';

export const OportunidadesPage: React.FC = () => {
  // Obtiene el estado del usuario logueado desde el contexto global de autenticación
  const { user } = useAuth();

  // Estado local para controlar la pestaña activa de navegación dentro del módulo
  const [tab, setTab] = useState<'explorar' | 'mis_postulaciones' | 'gestion'>('explorar');

  // Si no hay sesión iniciada, no se renderiza la vista
  if (!user) return null;

  // Discriminación de capacidades de navegación basada en roles
  const esAlumno = user.rol === 'alumno';
  const esResponsableOAdmin = user.rol === 'profesor' || user.rol === 'admin' || user.rol === 'preceptor';

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Encabezado Principal del Módulo de Oportunidades */}
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

          {/* Barra de Pestañas con Filtrado de Permisos por Rol */}
          <div className={styles.tabsBar} style={{ borderBottom: 'none' }}>
            {/* Pestaña pública para todos los roles */}
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'explorar' ? styles.tabActive : ''}`}
              onClick={() => setTab('explorar')}
            >
              <i className="bx bx-search-alt"></i> Explorar Convocatorias
            </button>

            {/* Pestaña restringida exclusivamente a Alumnos */}
            {esAlumno && (
              <button
                type="button"
                className={`${styles.tabBtn} ${tab === 'mis_postulaciones' ? styles.tabActive : ''}`}
                onClick={() => setTab('mis_postulaciones')}
              >
                <i className="bx bx-file"></i> Mis Postulaciones
              </button>
            )}

            {/* Pestaña restringida a Roles con facultad de Gestión Académica/Administrativa */}
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

