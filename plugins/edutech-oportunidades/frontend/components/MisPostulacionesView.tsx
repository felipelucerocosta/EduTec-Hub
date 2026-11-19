import React, { useState, useEffect } from 'react';
import OportunidadesAPI, { type PostulacionItem } from '../services/oportunidades_api';
import styles from '../styles/oportunidades.module.css';

export const MisPostulacionesView: React.FC = () => {
  const [postulaciones, setPostulaciones] = useState<PostulacionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    cargarPostulaciones();
  }, []);

  const cargarPostulaciones = async () => {
    try {
      setLoading(true);
      const data = await OportunidadesAPI.misPostulaciones();
      setPostulaciones(data);
    } catch (err) {
      console.error('Error al cargar mis postulaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas cancelar tu postulación a esta convocatoria?')) return;
    try {
      await OportunidadesAPI.cancelarPostulacion(id);
      cargarPostulaciones();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar');
    }
  };

  const getBadgeClass = (estado: string) => {
    switch (estado) {
      case 'aceptada':
        return styles.badgeSuccess;
      case 'en_evaluacion':
      case 'entrevista':
        return styles.badgeInfo;
      case 'rechazada':
      case 'cancelada':
        return styles.badgeDanger;
      default:
        return styles.badgeWarning;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
        <p>Cargando tus postulaciones...</p>
      </div>
    );
  }

  if (postulaciones.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
        <i className="bx bx-file-blank" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}></i>
        <h3 style={{ color: '#cbd5e1', margin: '0.5rem 0' }}>Aún no te has postulado a ninguna oportunidad</h3>
        <p style={{ fontSize: '0.88rem' }}>Explora el catálogo de convocatorias y postula a pasantías o proyectos formativos.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
        Total de postulaciones registradas: <strong>{postulaciones.length}</strong>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {postulaciones.map((p) => (
          <div
            key={p.id}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span className={styles.institutionTag}>
                  <i className="bx bx-buildings"></i> {p.institucion}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0.2rem 0' }}>
                  {p.oportunidad_titulo}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Postulado el: {new Date(p.fecha_postulacion).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`${styles.badge} ${getBadgeClass(p.estado)}`}>
                  {p.estado.replace('_', ' ').toUpperCase()}
                </span>

                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(p.contacto_email || 'felipelucero534@gmail.com')}&su=${encodeURIComponent(`[EduTech] Consulta sobre postulación: ${p.oportunidad_titulo}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.secondaryBtn}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    textDecoration: 'none',
                    color: '#f8fafc',
                    borderColor: 'rgba(234, 67, 53, 0.4)'
                  }}
                  title="Escribir correo directo al responsable desde tu Gmail"
                >
                  <i className="bx bxl-gmail" style={{ color: '#ea4335' }}></i> Contactar por Gmail
                </a>

                {p.estado === 'pendiente' && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={() => handleCancelar(p.id)}
                  >
                    <i className="bx bx-x"></i> Cancelar
                  </button>
                )}
              </div>
            </div>

            {p.motivacion && (
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1', background: 'rgba(30, 41, 59, 0.5)', padding: '0.65rem', borderRadius: '8px' }}>
                <strong>Tu motivación enviada:</strong>
                <p style={{ margin: '0.2rem 0 0 0', fontStyle: 'italic' }}>"{p.motivacion}"</p>
              </div>
            )}

            {p.notas_responsable && (
              <div style={{ fontSize: '0.84rem', color: '#6ee7b7', background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.3)', padding: '0.65rem', borderRadius: '8px' }}>
                <strong><i className="bx bx-message-check"></i> Mensaje del Responsable:</strong>
                <p style={{ margin: '0.2rem 0 0 0' }}>{p.notas_responsable}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MisPostulacionesView;

