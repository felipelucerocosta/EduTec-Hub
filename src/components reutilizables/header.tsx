// Header.tsx
import React from "react";
import styles from "../App.module.css"; // Importa tu CSS Module

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <img
        src="/Educación Técnica y Herramientas (2).png"
        alt="Logo EduTecH"
      />
      <h1>Tech-Room 29</h1>
    </header>
  );
};

export default Header;
