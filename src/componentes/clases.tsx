import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles.module.css"; // 👈 módulo css
import Header from "../components reutilizables/header";

interface Clase {
  materia: string;
  nombre: string;
  seccion: string;
  aula: string;
  creador: string;
}

const STORAGE_KEY = "mis_clases"; // 🔹 clave para localStorage

const Clases: React.FC = () => {
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [clases, setClases] = useState<Clase[]>([]);
  const navigate = useNavigate();

  // 🔹 Cargar clases guardadas al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setClases(JSON.parse(saved));
      } catch {
        console.error("Error al leer localStorage");
      }
    }
  }, []);

  // 🔹 Guardar clases cada vez que cambien
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clases));
  }, [clases]);

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
    setClases((prev) => [...prev, nuevaClase]);
    e.currentTarget.reset();
    setMostrarCrear(false);
  };

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
    <div className={styles.body}>
      <Header />
      <main>
        <div className={styles.mainLayout}>
          <div style={{ flex: "1 1 400px" }}>
            {mostrarCrear && (
              <section className={styles.formContainer}>
                <form onSubmit={handleCrearClase} noValidate>
                  <input className={styles.formInput} type="text" name="materia" placeholder="Materia" required />
                  <input className={styles.formInput} type="text" name="nombre" placeholder="Nombre de la clase" required />
                  <input className={styles.formInput} type="text" name="seccion" placeholder="Sección" required />
                  <input className={styles.formInput} type="text" name="aula" placeholder="Aula" required />
                  <input className={styles.formInput} type="text" name="creador" placeholder="Profesor" required />
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Crear clase
                  </button>
                </form>
              </section>
            )}
            {mostrarUnirse && (
              <section className={styles.formContainer}>
                <form onSubmit={handleUnirseClase} noValidate>
                  <input className={styles.formInput} type="text" name="materia" placeholder="Materia" required />
                  <input className={styles.formInput} type="text" name="codigo" placeholder="Código de clase" required />
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
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={() => {
                    setMostrarCrear(!mostrarCrear);
                    setMostrarUnirse(false);
                  }}
                >
                  Crear clase
                </button>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
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

        <div className={styles.coursesList}>
          {clases.map((clase, index) => (
            <button
              key={index}
              className={styles.claseItem}
              onClick={() => navigate("/Foro")}
            >
              <h3>{clase.nombre}</h3>
              <p><strong>Materia:</strong> {clase.materia}</p>
              <p><strong>Sección:</strong> {clase.seccion}</p>
              <p><strong>Aula:</strong> {clase.aula}</p>
              <p><strong>Profesor:</strong> {clase.creador}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Clases;
