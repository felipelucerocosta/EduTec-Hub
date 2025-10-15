import React, { useState } from "react";
import styles from "../simulacion.module.css";
import Header5 from "../components reutilizables/header5";
import EngineWorkshop from "./motor"; 
import Simulation from "./plantas";// importa el componente motor

interface Simulacion {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
}

const simulaciones: Simulacion[] = [
  {
    id: 1,
    titulo: "Simulación 1",
    descripcion: "Arreglar un motor de combustión interna",
    imagen: "../public/descarga.png",
  },
  {
    id: 2,
    titulo: "Simulación 2",
    descripcion: "Estudio de ecosistemas marinos",
    imagen: "../public/descarga.png",
  },
  {
    id: 3,
    titulo: "Simulación 3",
    descripcion: "Prácticas de circuitos eléctricos",
    imagen: "../public/descarga.png",
  },
  {
    id: 4,
    titulo: "Simulación 4",
    descripcion: "Realidad aumentada en química",
    imagen: "../public/descarga.png",
  },
];

const GaleriaSimulaciones: React.FC = () => {
  const [simSeleccionada, setSimSeleccionada] = useState<number | null>(null);

  const handleSeleccion = (sim: Simulacion) => {
    // Si es la primera simulación, mostramos el motor
    if (sim.id === 1) {
      setSimSeleccionada(1);
    } else {
      alert(`Has seleccionado: ${sim.titulo}`);
    }
  };

  // Si se seleccionó la primera simulación, renderizamos el motor
  if (simSeleccionada === 1) {
    return <EngineWorkshop />;
  }
  else if (simSeleccionada === 2) {
    return <Simulation />
  }

  return (
    <div className={styles.body}>
      <Header5 />
      <div className={styles.container}>
        <div className={styles["main-content"]}>
          <h2>SIMULACIONES DE PRACTICAS</h2>
          <div className={styles.grid}>
            {simulaciones.map((sim) => (
              <div
                key={sim.id}
                className={styles.card}
                onClick={() => handleSeleccion(sim)}
              >
                <img src={sim.imagen} alt={sim.titulo} />
                <div className={styles["card-title"]}>{sim.titulo}</div>
                <div className={styles["card-desc"]}>{sim.descripcion}</div>
                <button
                  className={styles.button}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeleccion(sim);
                  }}
                >
                  Seleccionar
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className={styles["admin-title"]}>[ADMINISTRACIÓN]</div>
      </div>
      <footer className={styles.footer}>
        <p>Derechos de autor © 2025 EdutecHub</p>
      </footer>
    </div>
  );
};

export default GaleriaSimulaciones;
