import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./header.module.css";

interface NavLinkItem {
  label: string;
  to: string;
  icon?: string;
}

interface HeaderProps {
  navLinks?: NavLinkItem[];
  showLogout?: boolean;
}

const Header: React.FC<HeaderProps> = ({ navLinks, showLogout = true }) => {
  const [user, setUser] = useState<{ id?: number; rol?: string; nombre?: string; nombre_completo?: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setUser(null);
        navigate("/");
      }
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const userName = user?.nombre || user?.nombre_completo || "Usuario";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
      <Link to="/" className={styles.brand}>
        <img
          src="/edutech-logo.png"
          alt="Edutech Logo"
          style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "8px" }}
        />
        <span className={styles.brandName}>Edutech</span>
      </Link>

      <nav className={styles.nav}>
        {navLinks &&
          navLinks.map((link, idx) => (
            <Link key={idx} to={link.to} className={styles.navLink}>
              {link.icon && <i className={`bx ${link.icon}`}></i>}
              {link.label}
            </Link>
          ))}
      </nav>

      <div className={styles.actions}>
        {user ? (
          <>
            <div className={styles.userBadge}>
              <div className={styles.userAvatar}>{userInitial}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userName}</span>
                {user.rol && (
                  <span className={`${styles.userRole} ${styles[`role_${user.rol}`]}`}>
                    {user.rol}
                  </span>
                )}
              </div>
            </div>
            {showLogout && (
              <button onClick={handleLogout} className={styles.logoutBtn} title="Cerrar sesión">
                <i className="bx bx-log-out"></i>
                <span>Salir</span>
              </button>
            )}
          </>
        ) : (
          !navLinks && (
            <Link to="/registro" className={styles.loginBtn}>
              <i className="bx bx-log-in"></i>
              Iniciar Sesión
            </Link>
          )
        )}
      </div>
    </header>
  );
};

export default Header;
