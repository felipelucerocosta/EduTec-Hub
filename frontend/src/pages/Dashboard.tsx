import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components reutilizables/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<any[]>([]);
  const [trabajosPendientes] = useState<any[]>([]);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch classes
        const endpoint = user.rol === 'alumno' ? '/api/alumno/mis-clases' : '/api/clases';
        const resClases = await fetch(`http://localhost:3001${endpoint}`, { credentials: 'include' });
        if (resClases.ok) {
          const dataClases = await resClases.json();
          setClases(Array.isArray(dataClases) ? dataClases : []);
        }

        // Fetch notifications
        const resNotif = await fetch('http://localhost:3001/api/notificaciones', { credentials: 'include' });
        if (resNotif.ok) {
          const dataNotif = await resNotif.json();
          setNotificaciones(Array.isArray(dataNotif) ? dataNotif : []);
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        showToast('Error al conectar con el servidor.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Welcome Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(56, 189, 248, 0.15))',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderRadius: '20px',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className={`badge ${
                user.rol === 'profesor' ? 'badge-purple' :
                user.rol === 'admin' ? 'badge-amber' : 'badge-green'
              }`}>
                Panel de {user.rol}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                EduTech Hub v2.0
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              ¡Hola, {user.nombre}! 👋
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '600px' }}>
              {user.rol === 'alumno'
                ? 'Revisa tus trabajos pendientes, fechas límite y novedades de tus materias.'
                : user.rol === 'profesor'
                ? 'Gestiona tus aulas virtuales, publica trabajos y califica las entregas de tus alumnos.'
                : 'Supervisión general del campus virtual, usuarios y comisiones.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {user.rol === 'profesor' && (
              <Button onClick={() => navigate('/clases')} icon="bx-plus">
                Crear Clase
              </Button>
            )}
            {user.rol === 'alumno' && (
              <Button onClick={() => navigate('/alumno')} icon="bx-key">
                Unirse a Clase
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/calendario')} icon="bx-calendar">
              Calendario
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
            }}>
              <i className="bx bx-book-open"></i>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                {clases.length}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                {user.rol === 'alumno' ? 'Clases Inscritas' : 'Clases a Cargo'}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
            }}>
              <i className="bx bx-task"></i>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                {trabajosPendientes.length}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                {user.rol === 'alumno' ? 'Entregas Pendientes' : 'Por Corregir'}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
            }}>
              <i className="bx bx-bell"></i>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                {notificaciones.filter(n => !n.leida).length}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                Avisos No Leídos
              </div>
            </div>
          </div>
        </div>

        {/* Classes Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
              Mis Clases Recientes
            </h2>
            <Button
              variant="outline"
              onClick={() => navigate(user.rol === 'alumno' ? '/alumno' : '/clases')}
              icon="bx-right-arrow-alt"
            >
              Ver Todas
            </Button>
          </div>

          {loading ? (
            <LoadingSkeleton type="card" count={3} />
          ) : clases.length === 0 ? (
            <EmptyState
              icon="bx-book-bookmark"
              title="No tienes clases registradas"
              description={user.rol === 'alumno'
                ? 'Introdúcete en una materia usando el código provisto por tu docente.'
                : 'Crea tu primera aula virtual para comenzar a subir trabajos y materiales.'}
              actionLabel={user.rol === 'alumno' ? 'Unirse a Clase' : 'Crear Clase'}
              onAction={() => navigate(user.rol === 'alumno' ? '/alumno' : '/clases')}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {clases.slice(0, 6).map((clase, idx) => (
                <div
                  key={clase.id || idx}
                  onClick={() => navigate(user.rol === 'alumno' ? `/alumno/gestion/${clase.id}` : `/gestionClase/${clase.id}`)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color-hover)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className="badge badge-purple">{clase.materia}</span>
                      {clase.codigo && <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>#{clase.codigo}</span>}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                      {clase.nombre}
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                      {clase.aula ? `Aula: ${clase.aula}` : ''} {clase.seccion ? `· ${clase.seccion}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Docente: {clase.creador || 'Docente'}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      Ingresar <i className="bx bx-right-arrow-alt"></i>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
