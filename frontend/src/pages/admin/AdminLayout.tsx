import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_ITEMS = [
  { path: '/admin', icon: 'bx-pulse', label: 'Command Center', exact: true },
  { path: '/admin/usuarios', icon: 'bx-user-check', label: 'Gestión Usuarios' },
  { path: '/admin/clases', icon: 'bx-network-chart', label: 'Matriz de Clases' },
  { path: '/admin/asignaciones', icon: 'bx-transfer-alt', label: 'Asignaciones' },
  { path: '/dashboard', icon: 'bx-arrow-back', label: 'Vista General' },
];

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/registro');
  };

  const isActive = (item: typeof SIDEBAR_ITEMS[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#06080f', color: '#f8fafc', fontFamily: 'var(--font-family-body)' }}>
      {/* ── Console Sidebar / Left Rail ── */}
      <aside
        style={{
          width: sidebarOpen ? '250px' : '72px',
          minHeight: '100vh',
          background: '#090d16',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
        aria-label="Barra de Navegación de Administración"
      >
        {/* Header / Brand */}
        <div
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'space-between' : 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            minHeight: '64px',
          }}
        >
          <div
            onClick={() => navigate('/admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', overflow: 'hidden' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
                color: '#fff',
                boxShadow: '0 0 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              <i className="bx bx-shield-quarter"></i>
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc', lineHeight: 1.2, fontFamily: 'var(--font-family-display)' }}>
                  TECH-ROOM 29
                </div>
                <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Command Center
                </div>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px',
              }}
              title="Colapsar"
              aria-label="Colapsar menú lateral"
            >
              <i className="bx bx-chevron-left" style={{ fontSize: '1.2rem' }}></i>
            </button>
          )}
        </div>

        {/* Collapsed Expand Trigger */}
        {!sidebarOpen && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
              }}
              title="Expandir barra de navegación"
              aria-label="Expandir barra de navegación"
            >
              <i className="bx bx-chevron-right" style={{ fontSize: '1.1rem' }}></i>
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={!sidebarOpen ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: sidebarOpen ? '0.7rem 0.85rem' : '0.7rem 0',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: isActive(item) ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                borderLeft: isActive(item) ? '3px solid #f59e0b' : '3px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderRadius: sidebarOpen ? '8px' : '0',
                color: isActive(item) ? '#fbbf24' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: isActive(item) ? 700 : 500,
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item)) (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!isActive(item)) (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
              }}
            >
              <i className={`bx ${item.icon}`} style={{ fontSize: '1.25rem', flexShrink: 0, color: 'inherit' }}></i>
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Console Health Indicators */}
        {sidebarOpen && (
          <div style={{ padding: '0.85rem', margin: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Telemetría del Servidor
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#34d399' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              Base de Datos SQLite: OK
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }}></span>
              Aislamiento RBAC: ACTIVO
            </div>
          </div>
        )}

        {/* User Identity & Logout Footer */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.65rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                A
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.nombre || 'Administrador'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.correo}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Cerrar sesión' : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              color: '#fb7185',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244, 63, 94, 0.15)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244, 63, 94, 0.08)'; }}
          >
            <i className="bx bx-log-out" style={{ fontSize: '1.1rem' }}></i>
            {sidebarOpen && 'Cerrar Sesión'}
          </button>
        </div>
      </aside>

      {/* ── Main Operations Canvas ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;
