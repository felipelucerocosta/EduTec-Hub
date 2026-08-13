import React from 'react';
import Sidebar from './Sidebar';
import Header from '../../components reutilizables/header';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, showSidebar = true }) => {
  if (!showSidebar) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header showLogout={true} />
        <main className="app-page-body">{children}</main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main-content">
        <Header showLogout={false} />
        <main className="app-page-body">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
