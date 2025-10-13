import React, { useState } from "react";
import "../styles.module.css";
import Header from "../components reutilizables/header";

interface Clase {
  materia: string;
  nombre: string;
  seccion: string;
  aula: string;
  creador: string;
}

const Clases: React.FC = () => {
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [clases, setClases] = useState<Clase[]>([]);

  // Manejar unión a clase
  const handleUnirseClase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const materia = formData.get("materia") as string;
    const codigo = formData.get("codigo") as string;
    console.log("Unido a clase:", { materia, codigo });
    e.currentTarget.reset();
    setMostrarUnirse(false);

    // Ejemplo: podrías agregar una clase “ficticia” cuando se une
    const nuevaClase: Clase = {
      materia,
      nombre: `Clase de ${materia}`,
      seccion: "Sin definir",
      aula: "Sin definir",
      creador: "Profesor asignado",
    };
    setClases([...clases, nuevaClase]);
  };

  return (
    <div>
      <Header />

      <main>
        <div className="main-layout">
          <div style={{ flex: "1 1 400px" }}>
            {/* Formulario solo para unirse */}
            {mostrarUnirse && (
              <section id="unirseClaseForm" className="form-container">
                <form id="formUnirseClase" onSubmit={handleUnirseClase} noValidate>
                  <input type="text" name="materia" placeholder="Materia" required />
                  <input
                    type="text"
                    name="codigo"
                    placeholder="Código de clase"
                    required
                  />
                  <button type="submit" className="btn btn-primary">
                    Unirse
                  </button>
                </form>
              </section>
            )}
          </div>
          <div style={{ flex: "2 1 600px" }}>
            <div className="container">
              <img
                src="/Educación Técnica y Herramientas (2).png"
                alt="Logo"
                className="illustration"
              />
              <div className="buttons">
                <button
                  className="btn btn-primary"
                  aria-controls="unirseClaseForm"
                  aria-expanded={mostrarUnirse}
                  onClick={() => setMostrarUnirse(!mostrarUnirse)}
                >
                  Unirse a clase
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de clases unidas */}
        <div id="coursesList">
          {clases.map((clase, index) => (
            <div key={index} className="clase-item">
              <h3>{clase.nombre}</h3>
              <p>
                <strong>Materia:</strong> {clase.materia}
              </p>
              <p>
                <strong>Sección:</strong> {clase.seccion}
              </p>
              <p>
                <strong>Aula:</strong> {clase.aula}
              </p>
              <p>
                <strong>Profesor:</strong> {clase.creador}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Clases;
