// Header.tsx
import React, { useEffect, useState } from "react";
import styles from "../App.module.css"; // Importa tu CSS Module

const Header: React.FC = () => {
  const [user, setUser] = useState<{ id?: number; rol?: string; nombre?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:3001/api/whoami', { credentials: 'include' });
        const data = await res.json();
        setUser(data.user || null);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  return (
    <header className={styles.header}>
      <img src="/Educación Técnica y Herramientas (2).png" alt="Logo EduTecH" />
      <h1>Tech-Room 29</h1>
      <div style={{ marginLeft: 'auto', marginRight: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <span>{user.nombre || 'Profesor'} {user.rol ? `(${user.rol})` : ''}</span>
            <button className={styles.btn} onClick={async () => {
              try {
                const r = await fetch('http://localhost:3001/api/logout', { method: 'POST', credentials: 'include' });
                const d = await r.json();
                if (r.ok && d.success) {
                  // refresh whoami
                  setUser(null);
                  window.location.reload();
                } else {
                  alert('No se pudo cerrar sesión');
                }
              } catch (err) {
                console.error('Logout error', err);
                alert('Error cerrando sesión');
              }
            }}>Cerrar sesión</button>
          </>
        ) : (
          <span>Invitado</span>
        )}
      </div>
    </header>
  );
};

export default Header;
