import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_ITEMS = [
  { path: '/admin',              icon: 'bx-home-alt-2',    label: 'Dashboard',      exact: true },
  { path: '/admin/usuarios',     icon: 'bx-group',         label: 'Usuarios' },
  { path: '/admin/clases',       icon: 'bx-chalkboard',    label: 'Clases' },
  { path: '/admin/asignaciones', icon: 'bx-transfer',      label: 'Asignaciones' },
];

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080c14', fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? '240px' : '64px',
        minHeight: '100vh',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        backdropFilter: 'blur(16px)',
      }}>
        {/* Logo / Toggle */}
        <div style={{
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          minHeight: '68px',
        }} onClick={() => setSidebarOpen(o => !o)}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0,
            boxShadow: '0 0 16px rgba(245,158,11,0.3)',
          }}>
            <i className="bx bx-shield-quarter" style={{ color: '#fff' }}></i>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc', lineHeight: 1.2 }}>
                EduTechHub
              </div>
              <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>Panel Admin</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '0.75rem 0' }}>
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={!sidebarOpen ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: sidebarOpen ? '0.75rem 1.25rem' : '0.75rem',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: isActive(item)
                  ? 'linear-gradient(90deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))'
                  : 'transparent',
                borderLeft: isActive(item) ? '3px solid #f59e0b' : '3px solid transparent',
                border: 'none',
                color: isActive(item) ? '#fbbf24' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: isActive(item) ? 700 : 500,
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isActive(item)) (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc'; }}
              onMouseLeave={e => { if (!isActive(item)) (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
            >
              <i className={`bx ${item.icon}`} style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {sidebarOpen && (
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '10px',
              padding: '0.75rem',
              marginBottom: '0.75rem',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.nombre || 'Admin'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.correo}
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
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.2)',
              color: '#fb7185',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.08)'; }}
          >
            <i className="bx bx-log-out" style={{ fontSize: '1.1rem' }}></i>
            {sidebarOpen && 'Cerrar Sesión'}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '100%' }}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;
