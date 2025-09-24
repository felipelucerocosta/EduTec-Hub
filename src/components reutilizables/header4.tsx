import React from "react";
import styles from "../App1.module.css"; // CSS Module

const Header4: React.FC = () => {
  return (
    <header className={styles.header}>
      <img
        src="/Educación Técnica y Herramientas (2).png"
        alt="Logo EduTecH"
      />
      <h1>EduTec-Hub</h1>

      <nav className={styles.header2}>
        <a href="/calendario">Calendario</a>
        <a href="/foro">Foro</a>
        <a href="/clases">Clases</a>
        <a href="/simulaciones">Simulaciones</a>
      </nav>
    </header>
  );
};

export default Header4;
