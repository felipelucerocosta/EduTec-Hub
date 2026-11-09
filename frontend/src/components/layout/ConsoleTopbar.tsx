import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ConsoleTopbarProps {
  onOpenCommandPalette: () => void;
  onToggleAlfred: () => void;
}

const ConsoleTopbar: React.FC<ConsoleTopbarProps> = ({ onOpenCommandPalette, onToggleAlfred }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userName = user?.nombre || 'Usuario';
  const userInitial = userName.charAt(0).toUpperCase();

  const getRoleBadgeStyle = (rol?: string) => {
    if (rol === 'admin') return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
    if (rol === 'profesor') return { background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', border: '1px solid rgba(124, 58, 237, 0.3)' };
    return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
  };

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        gap: '1rem'
      }}
    >
      {/* Left: Quick Search / Command Palette trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '440px' }}>
        <button
          onClick={onOpenCommandPalette}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#94a3b8',
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          }}
          aria-label="Buscar o abrir consola de comandos"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bx bx-search" style={{ fontSize: '1.1rem', color: '#7c3aed' }}></i>
            <span>Buscar materias, entregas, alumnos...</span>
          </div>
          <kbd
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.72rem',
              color: '#94a3b8',
              fontFamily: 'monospace'
            }}
          >
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Center/Right: Academic Status & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Academic Period Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '50px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            color: '#38bdf8',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.02em'
          }}
          className="hide-on-mobile"
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
          Ciclo Lectivo 2026
        </div>

        {/* Alfred AI Assistant Drawer Trigger */}
        <button
          onClick={onToggleAlfred}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(56, 189, 248, 0.15))',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            color: '#e2e8f0',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#7c3aed';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title="Abrir Asistente Institucional Alfred"
        >
          <i className="bx bx-bot" style={{ color: '#38bdf8', fontSize: '1.1rem' }}></i>
          <span>Alfred IA</span>
        </button>

        {/* User Identity & Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '0.85rem' }}>
            <div
              onClick={() => navigate('/perfil')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              title="Ver mi perfil"
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {userInitial}
              </div>
              <div className="hide-on-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.2 }}>
                  {userName}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginTop: '2px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    width: 'fit-content',
                    ...getRoleBadgeStyle(user.rol)
                  }}
                >
                  {user.rol}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fb7185';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <i className="bx bx-log-out" style={{ fontSize: '1.1rem' }}></i>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default ConsoleTopbar;
