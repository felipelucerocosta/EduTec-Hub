import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: 'bx-grid-alt' },
    { label: 'Mis Clases', to: user.rol === 'alumno' ? '/alumno' : '/clases', icon: 'bx-book-open' },
    { label: 'Rendimiento', to: '/rendimiento', icon: 'bx-bar-chart-alt-2' },
    ...(user.rol === 'alumno' ? [{ label: 'Mi Boletín', to: '/boletin', icon: 'bx-receipt' }] : []),
    { label: 'Calendario', to: '/calendario', icon: 'bx-calendar' },
    { label: 'Foro de Consultas', to: '/foro', icon: 'bx-conversation' },
    { label: 'Mi Perfil', to: '/perfil', icon: 'bx-user-circle' },
  ];

  if (user.rol === 'admin') {
    navItems.push({ label: 'Panel Admin', to: '/admin', icon: 'bx-shield-quarter' });
  }


  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 1001,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer',
          display: 'none'
        }}
        className="mobile-sidebar-toggle"
        aria-label="Abrir menú"
      >
        <i className={`bx ${mobileOpen ? 'bx-x' : 'bx-menu'}`} style={{ fontSize: '1.5rem' }}></i>
      </button>

      {/* Sidebar Container */}
      <aside
        style={{
          width: collapsed ? '80px' : '260px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1000,
          position: 'sticky',
          top: 0,
          height: '100vh'
        }}
      >
        {/* Header / Brand */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/edutech-logo.png"
              alt="EduTech Logo"
              style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'contain' }}
            />
            {!collapsed && (
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                EduTech
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: collapsed ? 'none' : 'block'
            }}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            <i className="bx bx-sidebar"></i>
          </button>
        </div>

        {/* User Card info */}
        {!collapsed && (
          <div style={{
            margin: '1rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: user.rol === 'profesor' ? 'linear-gradient(135deg, #7c3aed, #38bdf8)' :
                          user.rol === 'admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                          'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff',
              fontSize: '1.1rem'
            }}>
              {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.nombre}
              </div>
              <span className={`badge ${
                user.rol === 'profesor' ? 'badge-purple' :
                user.rol === 'admin' ? 'badge-amber' : 'badge-green'
              }`} style={{ fontSize: '0.68rem', padding: '2px 8px', marginTop: '2px' }}>
                {user.rol}
              </span>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                color: isActive ? '#f8fafc' : '#94a3b8',
                background: isActive ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.92rem',
                transition: 'all 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start'
              })}
              title={collapsed ? item.label : undefined}
            >
              <i className={`bx ${item.icon}`} style={{ fontSize: '1.25rem', flexShrink: 0 }}></i>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              color: '#fb7185',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.15)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'background 0.2s ease'
            }}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <i className="bx bx-log-out" style={{ fontSize: '1.25rem' }}></i>
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
