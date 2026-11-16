import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = user.rol === 'preceptor'
    ? [
        { label: 'Panel Preceptoría', to: '/preceptoria', icon: 'bx-id-card' },
        { label: 'Asistencias', to: '/asistencia', icon: 'bx-calendar-check' },
        { label: 'Cursos y Clases', to: '/clases', icon: 'bx-book-open' },
        { label: 'Oportunidades', to: '/oportunidades', icon: 'bx-briefcase-alt-2' },
        { label: 'Calendario Académico', to: '/calendario', icon: 'bx-calendar' },
        { label: 'Simuladores', to: '/simuladores', icon: 'bx-chip' },
        { label: 'Mi Perfil', to: '/perfil', icon: 'bx-user-circle' },
      ]
    : [
        { label: 'Dashboard Analítico', to: '/dashboard', icon: 'bx-grid-alt' },
        { label: 'Mis Clases', to: user.rol === 'alumno' ? '/alumno' : '/clases', icon: 'bx-book-open' },
        { label: 'Oportunidades', to: '/oportunidades', icon: 'bx-briefcase-alt-2' },
        { label: user.rol === 'alumno' ? 'Mi Rendimiento' : 'Rendimiento', to: '/rendimiento', icon: 'bx-bar-chart-alt-2' },
        ...(user.rol === 'alumno' ? [{ label: 'Mi Boletín Oficial', to: '/boletin', icon: 'bx-receipt' }] : []),
        { label: 'Asistencias', to: '/asistencia', icon: 'bx-calendar-check' },
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
          background: '#0b0d1a',
          borderRight: '1px solid rgba(151, 71, 255, 0.12)',
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
                background: 'linear-gradient(135deg, #7929d2, #55ddf5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 14px rgba(121, 41, 210, 0.4)'
              }}
            >
              <i className="bx bx-atom" style={{ color: '#fff', fontSize: '1.25rem' }}></i>
            </div>
            {!collapsed && (
              <span
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#f3f0ff',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-family-display)',
                  whiteSpace: 'nowrap'
                }}
              >
                EduTech
              </span>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b6688',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f0ff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6688')}
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
                color: '#a9a3c7',
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
                e.currentTarget.style.color = '#9747ff';
                e.currentTarget.style.borderColor = 'rgba(151, 71, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#a9a3c7';
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
                color: isActive ? '#f3f0ff' : '#a9a3c7',
                background: isActive ? 'rgba(121, 41, 210, 0.16)' : 'transparent',
                borderLeft: isActive ? '3px solid #7929d2' : '3px solid transparent',
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
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f3f0ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.nombre}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#6b6688', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
