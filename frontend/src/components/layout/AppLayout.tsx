import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ConsoleTopbar from './ConsoleTopbar';
import CommandPalette from './CommandPalette';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, showSidebar = true }) => {
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleAlfred = () => {
    window.dispatchEvent(new CustomEvent('toggle-alfred'));
  };

  return (
    <div className="app-layout">
      {showSidebar && <Sidebar />}

      <div className="app-main-content">
        <ConsoleTopbar
          onOpenCommandPalette={() => setCmdPaletteOpen(true)}
          onToggleAlfred={handleToggleAlfred}
        />
        <main className="app-page-body">{children}</main>
      </div>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onOpenAlfred={handleToggleAlfred}
      />
    </div>
  );
};

export default AppLayout;
