import React from "react";
import "../App1.css"; // importa estilos globales (incluye .header)

const Header2: React.FC = () => {
  return (
    <>
      <div className="header">
        <img
          src="/Educación Técnica y Herramientas (2).png"
          alt="Logo EduTecH"
        />
        <h1>EduTec-Hub</h1>


         <div className="header2">
        <a href="/">Zona De Trabajo</a>
        <a href="/cursos">Calendario</a>
        <a href="/foro">Foro</a>
        <a href="/foro">Simulaciones</a>
      </div>
      </div>

     
    </>
  );
};

export default Header2;
