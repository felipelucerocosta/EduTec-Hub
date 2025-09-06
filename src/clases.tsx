import React, { useState } from "react";
import "./styles.css";
import Header from "../src/components reutilizables/header";

interface Clase {
  materia: string;
  nombre: string;
  seccion: string;
  aula: string;
  creador: string;
}

const Clases: React.FC = () => {
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [clases, setClases] = useState<Clase[]>([]);

  // Manejar creación de clase
  const handleCrearClase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nuevaClase: Clase = {
      materia: formData.get("materia") as string,
      nombre: formData.get("nombre") as string,
      seccion: formData.get("seccion") as string,
      aula: formData.get("aula") as string,
      creador: formData.get("creador") as string,
    };
    setClases([...clases, nuevaClase]);
    e.currentTarget.reset();
    setMostrarCrear(false);
  };

  // Manejar unión a clase
  const handleUnirseClase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const materia = formData.get("materia") as string;
    const codigo = formData.get("codigo") as string;
    console.log("Unido a clase:", { materia, codigo });
    e.currentTarget.reset();
    setMostrarUnirse(false);
  };

  return (
    <div>
       <Header />

      <main>
        <div className="container">
          <img
            src="/Educación Técnica y Herramientas (2).png"
            alt="Logo"
            className="illustration"
          />
          <div className="buttons">
            <button
              className="btn btn-outline"
              aria-controls="crearClaseForm"
              aria-expanded={mostrarCrear}
              onClick={() => {
                setMostrarCrear(!mostrarCrear);
                setMostrarUnirse(false);
              }}
            >
              Crear clase
            </button>
            <button
              className="btn btn-primary"
              aria-controls="unirseClaseForm"
              aria-expanded={mostrarUnirse}
              onClick={() => {
                setMostrarUnirse(!mostrarUnirse);
                setMostrarCrear(false);
              }}
            >
              Unirse a clase
            </button>
          </div>
        </div>

        {/* Formulario para crear clase */}
        {mostrarCrear && (
          <section id="crearClaseForm" className="form-container">
            <form id="formCrearClase" onSubmit={handleCrearClase} noValidate>
              <input type="text" name="materia" placeholder="Materia" required />
              <input
                type="text"
                name="nombre"
                placeholder="Nombre de la clase"
                required
              />
              <input
                type="text"
                name="seccion"
                placeholder="Sección"
                required
              />
              <input type="text" name="aula" placeholder="Aula" required />
              <input
                type="text"
                name="creador"
                placeholder="Profesor"
                required
              />
              <button type="submit" className="btn btn-primary">
                Crear clase
              </button>
            </form>
          </section>
        )}

        {/* Formulario para unirse a clase */}
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

        {/* Lista de clases */}
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
