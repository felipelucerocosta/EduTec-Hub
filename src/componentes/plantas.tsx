// Simulation.tsx
import React, { useState } from 'react';
import styles from '../simulacion.module.css';
import appStyles from '../App.module.css';

// Interfaz para definir el tipo de un paso
interface Step {
  id: number;
  name: string;
  status: string;  // Puede ser 'pending', 'current', o 'completed'
}

const stepsData: Step[] = [
  { id: 1, name: 'Preparar el suelo', status: 'pending' },
  { id: 2, name: 'Plantar la semilla', status: 'pending' },
  { id: 3, name: 'Regar la planta', status: 'pending' },
  { id: 4, name: 'Aplicar fertilizante', status: 'pending' },
];

function Simulation() {
  const [steps, setSteps] = useState<Step[]>(stepsData);  // Estado con tipo Step[]
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);  // Índice como número
  const [progress, setProgress] = useState<number>(0);  // Progreso como número

  // Función para avanzar al siguiente paso
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const updatedSteps: Step[] = steps.map((step, index) => {
        if (index === currentStepIndex) {
          return { ...step, status: 'completed' };  // Marca como completado
        } else if (index === currentStepIndex + 1) {
          return { ...step, status: 'current' };  // Marca como actual
        }
        return step;
      });
      setSteps(updatedSteps);
      setCurrentStepIndex(currentStepIndex + 1);
      setProgress(((currentStepIndex + 2) / steps.length) * 100);  // Actualiza el progreso
    }
  };

  // Función para manejar el inicio del drag and drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tool: string) => {
    e.dataTransfer.setData('tool', tool);  // Almacena el nombre de la herramienta
  };

  // Función para manejar el drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const tool: string = e.dataTransfer.getData('tool');
    alert(`Herramienta "${tool}" usada en el jardín!`);  // Simulación de acción
    // Aquí podrías agregar lógica para actualizar el estado
  };

  // Función para manejar el drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();  // Permite el drop
    e.currentTarget.classList.add(styles['drag-over']);  // Aplica el estilo
  };

  // Función para manejar el drag leave
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove(styles['drag-over']);  // Quita el estilo
  };

  return (
    <div className={appStyles.mainContainer}>
      <div className={styles.body}>
        <div className={styles['container main-content']}>
        <h2>Simulación de Práctica de Jardinería</h2>
        
        {/* Grid Layout */}
        <div className={styles.grid}>
          
          {/* Card de Pasos */}
          <div className={`${styles.card} ${styles['steps-card']}`}>
            <h3 className={styles['card-title']}>Pasos</h3>
            <div className={styles['progress-container']}>
              <div className={styles['progress-label']}>
                Progreso: {progress}% <span className={styles['progress-icon']}>🌱</span>
              </div>
              <div className={styles['progress-bar']}>
                <div
                  className={styles['progress-fill']}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <ul className={styles['steps-list']}>
              {steps.map((step: Step, index: number) => (
                <li
                  key={step.id}
                  className={`${styles['steps-list']} ${styles[step.status]}`}
                >
                  <span className={styles['step-icon']}>🌿</span>
                  <strong>{step.name}</strong>
                  <p className={styles['card-desc']}>
                    {index === currentStepIndex && 'Paso actual'}
                  </p>
                </li>
              ))}
            </ul>
            <button
              className={styles['button']}
              onClick={handleNextStep}
              disabled={currentStepIndex >= steps.length - 1}
            >
              Siguiente Paso
            </button>
          </div>
          
          {/* Card de Engine (Visualización del Jardín) */}
          <div
            className={`${styles.card} ${styles['engine-card']}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <h3 className={styles['card-title']}>Jardín</h3>
            <div className={styles['engine-svg-wrapper']}>
              <svg width="200" height="200" className={styles['rotating-bolt']}>
                {/* SVG simple de una planta */}
                <circle cx="100" cy="100" r="50" fill="green" />
                <text x="100" y="100" textAnchor="middle" dy=".3em" className={styles['svg-text']}>
                  Planta
                </text>
              </svg>
            </div>
            <div className={styles['engine-status']}>
              {progress < 100 ? 'En Progreso' : '¡Jardín Completado! ✅'}
            </div>
            <div className={styles.status}>
              <p>
                <span className={`${styles['status-icon']} ${styles['status-ok']}`}>🌱</span>
                Estado: {progress}% completado
              </p>
            </div>
          </div>
          
          {/* Card de Toolbox (Herramientas) */}
          <div className={`${styles.card} ${styles['toolbox-card']}`}>
            <h3 className={styles['card-title']}>Herramientas</h3>
            <div className={styles['tool-list']}>
              <div
                className={styles.tool}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'Pala')}
              >
                Pala
                <p className={styles['card-desc']}>Para preparar el suelo</p>
              </div>
              <div
                className={styles.tool}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'Riego')}
              >
                Riego
                <p className={styles['card-desc']}>Para regar la planta</p>
              </div>
              <div
                className={styles.tool}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'Fertilizante')}
              >
                Fertilizante
                <p className={styles['card-desc']}>Para nutrir la planta</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mensaje final */}
        <div className={styles.message}>
          {progress === 100 && '¡Felicidades! Has completado la práctica de jardinería.'}
        </div>
        
        {/* Footer */}
        <footer className={styles.footer}>
          Simulación creada con React y estilos personalizados.
        </footer>
        </div>
      </div>
    </div>
  );
}

export default Simulation;