import React, { useState, useEffect } from "react";
import styles from "../styles.module.css";
import HeaderAlumno from "../components reutilizables/HeaderAlumno";
import { Link } from "react-router-dom";

interface Clase {
  materia: string;
  nombre: string;
  seccion: string;
  aula: string;
  creador: string;
  codigo?: string;
}

const ClasesAlumno: React.FC = () => {
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [clases, setClases] = useState<Clase[]>([]);
  const [mensajeError, setMensajeError] = useState("");

  // 1. Cargar clases (CORREGIDO: credentials: 'include')
  const cargarClases = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/alumno/mis-clases", {
        credentials: 'include' // 👈 ¡MUY IMPORTANTE! Envía la cookie de sesión
      });
      
      if (response.ok) {
        const data = await response.json();
        setClases(data);
      }
    } catch (error) {
      console.error("Error cargando clases:", error);
    }
  };

  useEffect(() => {
    cargarClases();
  }, []);

  // 2. Unirse a clase (CORREGIDO: credentials: 'include')
  const handleUnirseClase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensajeError("");
    const formData = new FormData(e.currentTarget);
    const materia = formData.get("materia") as string;
    const codigo = formData.get("codigo") as string;

    try {
      const response = await fetch("http://localhost:3001/api/unirse-clase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materia, codigo }),
        credentials: 'include' // 👈 ¡MUY IMPORTANTE! Envía la cookie de sesión
      });

      const resultado = await response.text();

      if (response.ok) {
        await cargarClases(); 
        setMostrarUnirse(false);
        (e.target as HTMLFormElement).reset();
        alert(resultado); 
      } else {
        setMensajeError(resultado); // Muestra el error del backend (ej: "Código incorrecto")
      }
    } catch (error) {
      console.error("Error al unirse:", error);
      setMensajeError("Error de conexión.");
    }
  };

  return (
    <div>
      <HeaderAlumno />

      <main>
        <div className={styles.mainLayout}>
          <div style={{ flex: "1 1 400px" }}>
            {mostrarUnirse && (
              <section id="unirseClaseForm" className={styles.formContainer}>
                <form id="formUnirseClase" onSubmit={handleUnirseClase} noValidate>
                  <h3 style={{marginBottom: '15px', color: '#333'}}>Unirse a una clase</h3>
                  {mensajeError && <p style={{color: 'red', marginBottom: '10px'}}>{mensajeError}</p>}
                  
                  <input
                    type="text"
                    name="materia"
                    placeholder="Materia (ej: Historia)"
                    required
                    className={styles.formInput}
                  />
                  <input
                    type="text"
                    name="codigo"
                    placeholder="Código de clase (ej: HIS1234)"
                    required
                    className={styles.formInput}
                  />
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Unirse
                  </button>
                </form>
              </section>
            )}
          </div>

          <div style={{ flex: "2 1 600px" }}>
            <div className={styles.container}>
              <img
                src="/Educación Técnica y Herramientas (2).png"
                alt="Logo"
                className={styles.illustration}
              />
              <div className={styles.buttons}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
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

        <div className={styles.coursesList}>
          {clases.length === 0 ? (
            <p style={{textAlign: 'center', width: '100%', color: '#666'}}>
              No estás inscrito en ninguna clase todavía.
            </p>
          ) : (
            clases.map((clase, index) => (
              <Link to="/alumno/gestion" key={index} className={styles.claseItem} style={{textDecoration: 'none', color: 'inherit'}}>
                <h3>{clase.nombre}</h3>
                <p><strong>Materia:</strong> {clase.materia}</p>
                <p><strong>Sección:</strong> {clase.seccion}</p>
                <p><strong>Aula:</strong> {clase.aula}</p>
                <p><strong>Profesor:</strong> {clase.creador}</p> 
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default ClasesAlumno;