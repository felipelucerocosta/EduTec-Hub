import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard Analítico', to: '/dashboard', icon: 'bx-grid-alt' },
    { label: 'Mis Clases', to: user.rol === 'alumno' ? '/alumno' : '/clases', icon: 'bx-book-open' },
    { label: user.rol === 'alumno' ? 'Mi Rendimiento' : 'Rendimiento', to: '/rendimiento', icon: 'bx-bar-chart-alt-2' },
    ...(user.rol === 'alumno' ? [{ label: 'Mi Boletín Oficial', to: '/boletin', icon: 'bx-receipt' }] : []),
    { label: 'Calendario Académico', to: '/calendario', icon: 'bx-calendar' },
    ...(user.rol !== 'profesor' ? [{ label: 'Foro Técnico', to: '/foro', icon: 'bx-conversation' }] : []),
    { label: 'Simuladores', to: '/simuladores', icon: 'bx-chip' },
    { label: 'Mi Perfil', to: '/perfil', icon: 'bx-user-circle' },
  ];

  if (user.rol === 'admin') {
    navItems.push({ label: 'Consola Admin', to: '/admin', icon: 'bx-shield-quarter' });
  }

  return (
    <>
      {/* Mobile Toggle floating button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 1001,
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className="mobile-sidebar-toggle"
        aria-label="Alternar navegación"
      >
        <i className={`bx ${mobileOpen ? 'bx-x' : 'bx-menu'}`} style={{ fontSize: '1.4rem' }}></i>
      </button>

      {/* Sidebar / Rail Container */}
      <aside
        style={{
          width: collapsed ? '72px' : '240px',
          background: '#0a0e17',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1000,
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0
        }}
        aria-label="Barra de navegación principal"
      >
        {/* Brand Header */}
        <div
          style={{
            height: '64px',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', overflow: 'hidden' }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(124, 58, 237, 0.35)'
              }}
            >
              <i className="bx bx-atom" style={{ color: '#fff', fontSize: '1.25rem' }}></i>
            </div>
            {!collapsed && (
              <span
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#f8fafc',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-family-display)',
                  whiteSpace: 'nowrap'
                }}
              >
                TECH-ROOM 29
              </span>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              title="Colapsar a barra compacta"
              aria-label="Colapsar a barra compacta"
            >
              <i className="bx bx-chevron-left" style={{ fontSize: '1.3rem' }}></i>
            </button>
          )}
        </div>

        {/* Collapsed Expand Trigger */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
            <button
              onClick={() => setCollapsed(false)}
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
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#7c3aed';
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
              title="Expandir barra de navegación"
              aria-label="Expandir barra de navegación"
            >
              <i className="bx bx-chevron-right" style={{ fontSize: '1.1rem' }}></i>
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav
          style={{
            flex: 1,
            padding: '0.75rem 0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            overflowY: 'auto'
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: collapsed ? '0.65rem 0' : '0.65rem 0.85rem',
                borderRadius: '8px',
                color: isActive ? '#f8fafc' : '#94a3b8',
                background: isActive ? 'rgba(124, 58, 237, 0.14)' : 'transparent',
                borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                transition: 'all 0.15s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none'
              })}
              title={collapsed ? item.label : undefined}
            >
              <i
                className={`bx ${item.icon}`}
                style={{
                  fontSize: '1.25rem',
                  flexShrink: 0,
                  color: 'inherit'
                }}
              ></i>
              {!collapsed && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Identity / Status */}
        <div
          style={{
            padding: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {!collapsed ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  flexShrink: 0
                }}
              ></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.nombre}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user.rol}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }} title={`${user.nombre} (${user.rol})`}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981'
                }}
              ></div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
