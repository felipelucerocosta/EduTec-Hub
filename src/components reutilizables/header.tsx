import React from "react";
import "../App.css"; // importa estilos globales (incluye .header)

const Header: React.FC = () => {
  return (
    <div className="header">
      <img
        src="/Educación Técnica y Herramientas (2).png"
        alt="Logo EduTecH"
      />
      <h1>EduTec-Hub</h1>
    </div>
  );
};

export default Header;
