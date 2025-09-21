import React, { useState, useRef } from "react";
import type { FormEvent } from "react"; // 👈 Import de tipo separado
import "../materiales.module.css";
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
      console.log("Nueva acta:", acta); // sin backend, sólo en consola
      e.currentTarget.reset();
    }
  };

  return (
    <div>
        <Header2 />

      <main className="contenedor-principal gestion-clase">
        <section className="columna">
          <h2>Materiales y Trabajos</h2>
          <div className="form-gestion">
            <h3>Añadir Nuevo Ítem</h3>
            <form id="form-agregar-material" onSubmit={agregarMaterial}>
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
              ></textarea>
              <div className="campos-libreta">
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
              <button type="submit" className="btn btn-principal">
                Añadir
              </button>
            </form>
          </div>
          <div id="lista-materiales">
            {materiales.map((mat, idx) => (
              <div key={idx} className="material-item">
                <h4>{mat.titulo}</h4>
                <p>{mat.descripcion}</p>
                <p>
                  Bimestre: {mat.bimestre} | %: {mat.porcentaje}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="columna">
          <div className="header-columna">
            <h2>Alumnos Inscritos</h2>
            <button className="btn" onClick={abrirLibreta}>
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

      {modalLibretaVisible && (
        <div className="modal-overlay">
          <div className="modal-contenido modal-libreta-contenido">
            <button className="modal-cerrar" onClick={cerrarLibreta}>
              &times;
            </button>
            <h2>Libreta de Notas</h2>
            <div id="contenedor-libreta" className="contenedor-tabla">
              {/* Contenido dinámico */}
            </div>
          </div>
        </div>
      )}

      {modalActaVisible && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <button className="modal-cerrar" onClick={cerrarActa}>
              &times;
            </button>
            <h2 id="titulo-modal-acta">Actas del Alumno</h2>
            <div id="historial-actas">{/* Contenido dinámico */}</div>
            <form
              id="form-agregar-acta"
              className="form-gestion"
              onSubmit={agregarActa}
            >
              <h3>Crear Nueva Acta</h3>
              <textarea
                placeholder="Describe el motivo del acta"
                ref={motivoActaRef}
                required
              ></textarea>
              <button type="submit" className="btn btn-principal">
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
