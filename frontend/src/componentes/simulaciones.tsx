import React, { useState } from "react";
import styles from "../simulacion.module.css";
import Header5 from "../components reutilizables/header5";

// Importar los componentes
import EngineWorkshop from "./motor";
import Economia from "./economia";
import Electricidad from "./electricidad";

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
    imagen: "../public/motor.jpg",
  },
  {
    id: 2,
    titulo: "Simulación 2",
    descripcion: "Computacion",
    imagen: "../public/computacopn.jpg",
  },
  {
    id: 3,
    titulo: "Simulación 3",
    descripcion: "Prácticas de circuitos eléctricos",
    imagen: "../public/cirguitos.jpg",
  },
];

const GaleriaSimulaciones: React.FC = () => {
  const [simSeleccionada, setSimSeleccionada] = useState<number | null>(null);

  const handleSeleccion = (sim: Simulacion) => {
    setSimSeleccionada(sim.id);
  };

  // 🔥 Renderizado condicional de cada componente
  if (simSeleccionada === 1) return <EngineWorkshop />;
  if (simSeleccionada === 2) return <Economia />;
  if (simSeleccionada === 3) return <Electricidad />;

  // 🖼 Galería
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
