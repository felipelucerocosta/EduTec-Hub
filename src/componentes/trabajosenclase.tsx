import React, { useState, useRef } from "react";
import type { FormEvent } from "react";
import styles from "../materiales.module.css";
import Header2 from "../components reutilizables/header2";

interface Material {
  titulo: string;
  descripcion: string;
  bimestre: number;
  porcentaje: number;
}

interface Alumno {
  nombre: string;
}

const GestionClase: React.FC = () => {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [alumnos] = useState<Alumno[]>([]);
  const [modalLibretaVisible, setModalLibretaVisible] = useState<boolean>(false);
  const [modalActaVisible, setModalActaVisible] = useState<boolean>(false);

  const tituloMaterialRef = useRef<HTMLInputElement>(null);
  const descripcionMaterialRef = useRef<HTMLTextAreaElement>(null);
  const bimestreMaterialRef = useRef<HTMLInputElement>(null);
  const porcentajeMaterialRef = useRef<HTMLInputElement>(null);
  const motivoActaRef = useRef<HTMLTextAreaElement>(null);

  const agregarMaterial = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      tituloMaterialRef.current &&
      descripcionMaterialRef.current &&
      bimestreMaterialRef.current &&
      porcentajeMaterialRef.current
    ) {
      const nuevoMaterial: Material = {
        titulo: tituloMaterialRef.current.value,
        descripcion: descripcionMaterialRef.current.value,
        bimestre: Number(bimestreMaterialRef.current.value),
        porcentaje: Number(porcentajeMaterialRef.current.value),
      };
      setMateriales((prev) => [...prev, nuevoMaterial]);
      e.currentTarget.reset();
    }
  };

  const abrirLibreta = () => setModalLibretaVisible(true);
  const cerrarLibreta = () => setModalLibretaVisible(false);
  const cerrarActa = () => setModalActaVisible(false);

  const agregarActa = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (motivoActaRef.current) {
      const acta = motivoActaRef.current.value;
      console.log("Nueva acta:", acta); // solo consola por ahora
      e.currentTarget.reset();
    }
  };

  return (
    <div>
      <Header2 />

      <main className={styles.contenedorPrincipal}>
        {/* ======== COLUMNA DE MATERIALES ======== */}
        <section className="columna">
          <h2>Materiales y Trabajos</h2>
          <div className={styles.formGestion}>
            <h3>Añadir Nuevo Ítem</h3>
            <form onSubmit={agregarMaterial}>
              <input
                type="text"
                placeholder="Título del trabajo"
                ref={tituloMaterialRef}
                required
              />
              <textarea
                placeholder="Descripción..."
                ref={descripcionMaterialRef}
                required
              />
              <div className={styles.camposLibretta}>
                <input
                  type="number"
                  placeholder="Bimestre (1-4)"
                  min={1}
                  max={4}
                  ref={bimestreMaterialRef}
                  required
                />
                <input
                  type="number"
                  placeholder="% de la nota final"
                  min={1}
                  max={100}
                  ref={porcentajeMaterialRef}
                  required
                />
              </div>
              <button type="submit" className={`${styles.btn} ${styles.btnPrincipal}`}>
                Añadir
              </button>
            </form>
          </div>

          <div id="lista-materiales">
            {materiales.map((mat, idx) => (
              <div key={idx} className={styles.materialItem}>
                <h4>{mat.titulo}</h4>
                <p>{mat.descripcion}</p>
                <p>Bimestre: {mat.bimestre} | %: {mat.porcentaje}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======== COLUMNA DE ALUMNOS ======== */}
        <section className="columna">
          <div className={styles.headerColumna}>
            <h2>Alumnos Inscritos</h2>
            <button className={styles.btn} onClick={abrirLibreta}>
              📊 Libreta de Notas
            </button>
          </div>
          <div id="lista-alumnos">
            {alumnos.map((alumno, idx) => (
              <div key={idx}>{alumno.nombre}</div>
            ))}
          </div>
        </section>
      </main>

      {/* ======== MODAL LIBRETA ======== */}
      {modalLibretaVisible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContenido}>
            <button className={styles.modalCerrar} onClick={cerrarLibreta}>
              &times;
            </button>
            <h2>Libreta de Notas</h2>
            <div id="contenedor-libreta">
              {/* Aquí se puede agregar contenido dinámico */}
            </div>
          </div>
        </div>
      )}

      {/* ======== MODAL ACTA ======== */}
      {modalActaVisible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContenido}>
            <button className={styles.modalCerrar} onClick={cerrarActa}>
              &times;
            </button>
            <h2>Actas del Alumno</h2>
            <form className={styles.formGestion} onSubmit={agregarActa}>
              <h3>Crear Nueva Acta</h3>
              <textarea
                placeholder="Describe el motivo del acta"
                ref={motivoActaRef}
                required
              />
              <button type="submit" className={`${styles.btn} ${styles.btnPrincipal}`}>
                Guardar Acta
              </button>
            </form>
          </div>
        </div>
      )}

      <footer>
        <p>Derechos de autor © 2025 EdutecHub</p>
      </footer>
    </div>
  );
};

export default GestionClase;
