import React from "react";
import styles from "../App1.module.css"; // CSS Module

const Header3: React.FC = () => {
  return (
    <header className={styles.header}>
      <img
        src="/Educación Técnica y Herramientas (2).png"
        alt="Logo EduTecH"
      />
      <h1>Tech-Room 29</h1>

      <nav className={styles.header2}>
        <a href="/gestionClase">Zona De Trabajo</a>
        <a href="/foro">Foro</a>
        <a href="/clases">Clases</a>
        <a href="/simulaciones">Simulaciones</a>
      </nav>
    </header>
  );
};

export default Header3;
