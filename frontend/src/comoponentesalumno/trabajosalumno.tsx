// GestionClase.tsx
import React, { useState } from "react";
import styles from "../materiales.module.css";
import Header4 from "../components reutilizables/header4";
import TareaDetalle from "../componentes/TareaDetalle"; // 👈 nuevo componente (corrección de mayúsculas)

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  porcentaje?: number;
}

interface Alumno {
  nombre: string;
}

const GestionClase: React.FC = () => {
  const [alumnos] = useState<Alumno[]>([
    { nombre: "Juan Pérez" },
    { nombre: "Ana Gómez" },
  ]);

  // 🔹 Lista de tareas cargadas (puede venir de API)
  const [tareas] = useState<Tarea[]>([
    {
      id: 1,
      titulo: "Trabajo Práctico Nº1",
      descripcion: "Realizar el circuito eléctrico del proyecto.",
      fechaEntrega: "2025-10-01",
      porcentaje: 30,
    },
    {
      id: 2,
      titulo: "Ensayo Técnico",
      descripcion: "Escribir un ensayo sobre seguridad eléctrica.",
      fechaEntrega: "2025-10-10",
      porcentaje: 10,
    },
  ]);

  // 🔹 Tarea seleccionada para ver detalle
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  return (
    <div>
      <Header4 />

      <main className={styles.contenedorPrincipal}>
        {/* ======== COLUMNA DE TAREAS ======== */}
        <section className={styles.columna}>
          <h2>📚 Tareas</h2>
          <div id="lista-tareas">
            {tareas.map((tarea) => (
              <div
                key={tarea.id}
                className={styles.materialItem}
                onClick={() => setTareaSeleccionada(tarea)}
                style={{ cursor: "pointer" }}
              >
                <h4>{tarea.titulo}</h4>
                <p>Entrega: {tarea.fechaEntrega}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======== COLUMNA DE ALUMNOS ======== */}
        <section className={styles.columna}>
          <div className={styles.headerColumna}>
            <h2>Alumnos Inscritos</h2>
          </div>
          <div id="lista-alumnos">
            {alumnos.map((alumno, idx) => (
              <div key={idx} className={styles.alumnoItem}>
                {alumno.nombre}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ======== MODAL DETALLE DE TAREA ======== */}
      {tareaSeleccionada && (
        <TareaDetalle
          tarea={tareaSeleccionada}
          onClose={() => setTareaSeleccionada(null)}
        />
      )}

      <footer>
        <p>Derechos de autor © 2025 EdutecHub</p>
      </footer>
    </div>
  );
};

export default GestionClase;
