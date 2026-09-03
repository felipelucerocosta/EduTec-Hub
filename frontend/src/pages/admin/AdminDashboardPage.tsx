import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

const API_URL = 'http://localhost:3001/api';

interface Stats {
  total_alumnos: number;
  total_profesores: number;
  total_clases: number;
  total_trabajos: number;
  entregas_pendientes: number;
}

const KpiCard: React.FC<{
  icon: string;
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
}> = ({ icon, label, value, color, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: `linear-gradient(135deg, ${color}22, ${color}0a)`,
      border: `1px solid ${color}44`,
      borderRadius: '18px',
      padding: '1.5rem',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}
    onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${color}22`; } }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
  >
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px',
      background: `${color}22`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.5rem', color,
    }}>
      <i className={`bx ${icon}`}></i>
    </div>
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.3rem', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/stats`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{
              background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
              padding: '0.2rem 0.75rem', borderRadius: '999px',
              fontSize: '0.78rem', fontWeight: 700,
              border: '1px solid rgba(245,158,11,0.3)',
            }}>
              MODO TESTING
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Panel de Administración
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Vista general del campus virtual · Gestión de usuarios, clases y asignaciones
          </p>
        </div>

        {/* KPI Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                height: '130px', borderRadius: '18px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                animation: 'pulse 1.5s infinite'
              }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <KpiCard icon="bx-group"           label="Alumnos"                 value={stats?.total_alumnos || 0}      color="#7c3aed" onClick={() => navigate('/admin/usuarios?rol=alumno')} />
            <KpiCard icon="bx-chalkboard"      label="Profesores"              value={stats?.total_profesores || 0}   color="#38bdf8" onClick={() => navigate('/admin/usuarios?rol=profesor')} />
            <KpiCard icon="bx-book-open"       label="Clases Activas"          value={stats?.total_clases || 0}       color="#10b981" onClick={() => navigate('/admin/clases')} />
            <KpiCard icon="bx-task"            label="Trabajos Publicados"     value={stats?.total_trabajos || 0}     color="#f59e0b" />
            <KpiCard icon="bx-time-five"       label="Entregas Por Corregir"   value={stats?.entregas_pendientes || 0} color="#f43f5e" />
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '1.5rem',
          }}>
            <h3 style={{ color: '#f8fafc', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bx bx-rocket" style={{ color: '#7c3aed' }}></i> Acciones Rápidas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { label: 'Crear nueva clase',     icon: 'bx-plus-circle',    path: '/admin/clases',       color: '#10b981' },
                { label: 'Gestionar usuarios',    icon: 'bx-user-plus',      path: '/admin/usuarios',     color: '#7c3aed' },
                { label: 'Ver asignaciones',      icon: 'bx-transfer',       path: '/admin/asignaciones', color: '#38bdf8' },
              ].map(action => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', borderRadius: '12px',
                    background: `${action.color}11`,
                    border: `1px solid ${action.color}33`,
                    color: action.color,
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${action.color}22`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${action.color}11`; }}
                >
                  <i className={`bx ${action.icon}`} style={{ fontSize: '1.15rem' }}></i>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '20px',
            padding: '1.5rem',
          }}>
            <h3 style={{ color: '#fbbf24', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bx bx-test-tube"></i> Guía de Testing
            </h3>
            <ol style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
              <li>Crear clase en <strong style={{ color: '#f8fafc' }}>Clases</strong></li>
              <li>Asignar Profesor de Prueba a la clase</li>
              <li>Inscribir Alumno de Prueba en la clase</li>
              <li>Profesor → publicar trabajo</li>
              <li>Alumno → entregar trabajo</li>
              <li>Profesor → corregir y calificar</li>
              <li>Verificar Rendimiento y Boletín</li>
            </ol>
            <div style={{
              marginTop: '1rem', padding: '0.75rem', borderRadius: '10px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              fontSize: '0.78rem', color: '#fbbf24'
            }}>
              💡 Ver <strong>TESTING_CREDENTIALS.md</strong> para credenciales completas
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
