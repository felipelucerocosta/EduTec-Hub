import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../App1.module.css"; // Usa los estilos mejorados de App1.module.css

interface NavLinkItem {
  label: string;
  to: string;
}

interface HeaderProps {
  navLinks?: NavLinkItem[];
  showLogout?: boolean;
}

const Header: React.FC<HeaderProps> = ({ navLinks, showLogout = true }) => {
  const [user, setUser] = useState<{ id?: number; rol?: string; nombre_completo?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3001/api/whoami", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setUser(null);
        navigate("/"); // Redirige a la página principal
      } else {
        alert("No se pudo cerrar sesión");
      }
    } catch (err) {
      console.error("Logout error", err);
      alert("Error cerrando sesión");
    }
  };

  return (
    <header className={styles.header}>
      <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
        <img src="/Educación Técnica y Herramientas (2).png" alt="Logo EduTecH" />
        <h1>Tech-Room 29</h1>
      </Link>

      <nav className={styles.header2}>
        {/* Renderizado dinámico de enlaces con Link de React Router */}
        {navLinks &&
          navLinks.map((link, idx) => (
            <Link key={idx} to={link.to}>
              {link.label}
            </Link>
          ))}

        {/* Sección de usuario autenticado y logout */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "10px" }}>
            <span style={{ color: "#000", fontWeight: 600, fontSize: "0.9rem" }}>
              {user.nombre_completo || "Usuario"} {user.rol ? `(${user.rol})` : ""}
            </span>
            {showLogout && (
              <button
                onClick={handleLogout}
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "15px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#dc2626")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
              >
                Cerrar sesión
              </button>
            )}
          </div>
        ) : (
          !navLinks && (
            <Link to="/registro" style={{ marginLeft: "10px" }}>
              Iniciar Sesión
            </Link>
          )
        )}
      </nav>
    </header>
  );
};

export default Header;
