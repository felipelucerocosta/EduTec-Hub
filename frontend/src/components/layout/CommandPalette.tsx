import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAlfred?: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onOpenAlfred }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const baseCommands = [
    { label: 'Ir a Dashboard', icon: 'bx-grid-alt', category: 'Navegación', action: () => navigate('/dashboard') },
    { label: 'Ir a Mis Clases', icon: 'bx-book-open', category: 'Navegación', action: () => navigate(user?.rol === 'alumno' ? '/alumno' : '/clases') },
    { label: 'Ir a Rendimiento Académico', icon: 'bx-bar-chart-alt-2', category: 'Navegación', action: () => navigate('/rendimiento') },
    ...(user?.rol === 'alumno' ? [{ label: 'Ver Mi Boletín de Calificaciones', icon: 'bx-receipt', category: 'Académico', action: () => navigate('/boletin') }] : []),
    { label: 'Abrir Calendario Académico', icon: 'bx-calendar', category: 'Navegación', action: () => navigate('/calendario') },
    { label: 'Ir a Foro de Consultas', icon: 'bx-conversation', category: 'Comunicación', action: () => navigate('/foro') },
    { label: 'Acceder a Simuladores Técnicos', icon: 'bx-chip', category: 'Herramientas', action: () => navigate('/simuladores') },
    { label: 'Ver Mi Perfil', icon: 'bx-user-circle', category: 'Cuenta', action: () => navigate('/perfil') },
    ...(user?.rol === 'admin' ? [{ label: 'Panel de Administración', icon: 'bx-shield-quarter', category: 'Gestión', action: () => navigate('/admin') }] : []),
    {
      label: 'Consultar al Asistente Alfred',
      icon: 'bx-bot',
      category: 'Asistente IA',
      action: () => {
        onClose();
        if (onOpenAlfred) onOpenAlfred();
        else window.dispatchEvent(new CustomEvent('toggle-alfred'));
      }
    },
    {
      label: 'Cerrar Sesión',
      icon: 'bx-log-out',
      category: 'Cuenta',
      action: async () => {
        onClose();
        await logout();
        navigate('/');
      }
    }
  ];

  const filteredCommands = baseCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    }
  };

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette-box" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-wrapper">
          <i className="bx bx-search"></i>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input-field"
            placeholder="Escribe un comando o busca una sección..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <span className="cmd-shortcut-badge">ESC para salir</span>
        </div>

        <div className="cmd-results-list">
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              No se encontraron comandos para "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={idx}
                className={`cmd-result-item ${idx === selectedIndex ? 'active' : ''}`}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`bx ${cmd.icon}`} style={{ fontSize: '1.2rem', color: idx === selectedIndex ? '#a78bfa' : '#64748b' }}></i>
                  <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{cmd.label}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {cmd.category}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

