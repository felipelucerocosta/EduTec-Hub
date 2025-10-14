import React, { useState } from "react";
import styles from "../styles.module.css";
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

  const handleUnirseClase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const materia = formData.get("materia") as string;
    const codigo = formData.get("codigo") as string;
    console.log("Unido a clase:", { materia, codigo });
    e.currentTarget.reset();
    setMostrarUnirse(false);

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
        <div className={styles.mainLayout}>
          <div style={{ flex: "1 1 400px" }}>
            {mostrarUnirse && (
              <section id="unirseClaseForm" className={styles.formContainer}>
                <form id="formUnirseClase" onSubmit={handleUnirseClase} noValidate>
                  <input
                    type="text"
                    name="materia"
                    placeholder="Materia"
                    required
                    className={styles.formInput}
                  />
                  <input
                    type="text"
                    name="codigo"
                    placeholder="Código de clase"
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

        {/* Lista de clases unidas */}
        <div className={styles.coursesList}>
          {clases.map((clase, index) => (
            <div key={index} className={styles.claseItem}>
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
