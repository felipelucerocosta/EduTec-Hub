import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 👈 importar
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
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [clases, setClases] = useState<Clase[]>([]);
  const navigate = useNavigate(); // 👈 hook para navegar

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
        <div className="main-layout">
          <div style={{ flex: "1 1 400px" }}>
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
                  <input type="text" name="seccion" placeholder="Sección" required />
                  <input type="text" name="aula" placeholder="Aula" required />
                  <input type="text" name="creador" placeholder="Profesor" required />
                  <button type="submit" className="btn btn-primary">
                    Crear clase
                  </button>
                </form>
              </section>
            )}
            {mostrarUnirse && (
              <section id="unirseClaseForm" className="form-container">
                <form id="formUnirseClase" onSubmit={handleUnirseClase} noValidate>
                  <input type="text" name="materia" placeholder="Materia" required />
                  <input type="text" name="codigo" placeholder="Código de clase" required />
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
          </div>
        </div>

        {/* Lista de clases como botones */}
        <div id="coursesList">
          {clases.map((clase, index) => (
            <button
              key={index}
              className="clase-item"
              onClick={() => navigate("/Foro")} // 👈 navegar al foro
            >
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
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Clases;
