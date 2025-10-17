// EconomicsSimulation.tsx
import React, { useState } from 'react';
import styles from '../simulacion.module.css';
import appStyles from '../App.module.css';

interface Step {
  id: number;
  name: string;
  status: string;  // 'pending', 'current', o 'completed'
}

const stepsData: Step[] = [
  { id: 1, name: 'Analizar la oferta', status: 'pending' },
  { id: 2, name: 'Analizar la demanda', status: 'pending' },
  { id: 3, name: 'Ajustar precios', status: 'pending' },
  { id: 4, name: 'Realizar transacción', status: 'pending' },
];

function EconomicsSimulation() {
  const [steps, setSteps] = useState<Step[]>(stepsData);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const updatedSteps: Step[] = steps.map((step, index) => {
        if (index === currentStepIndex) {
          return { ...step, status: 'completed' };
        } else if (index === currentStepIndex + 1) {
          return { ...step, status: 'current' };
        }
        return step;
      });
      setSteps(updatedSteps);
      setCurrentStepIndex(currentStepIndex + 1);
      setProgress(((currentStepIndex + 2) / steps.length) * 100);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tool: string) => {
    e.dataTransfer.setData('tool', tool);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const tool: string = e.dataTransfer.getData('tool');
    alert(`Herramienta "${tool}" aplicada en el mercado económico!`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles['drag-over']);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove(styles['drag-over']);
  };

  return (
    <div className={appStyles.mainContainer}>
      <div className={styles.body}>
        <div className={styles['container main-content']}>
        <h2>Simulación de Economía: Mercado de Oferta y Demanda</h2>
        
        <div className={styles.grid}>
          
          <div className={`${styles.card} ${styles['steps-card']}`}>
            <h3 className={styles['card-title']}>Pasos</h3>
            <div className={styles['progress-container']}>
              <div className={styles['progress-label']}>
                Progreso: {progress}% <span className={styles['progress-icon']}>📈</span>
              </div>
              <div className={styles['progress-bar']}>
                <div className={styles['progress-fill']} style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <ul className={styles['steps-list']}>
              {steps.map((step: Step, index: number) => (
                <li key={step.id} className={`${styles['steps-list']} ${styles[step.status]}`}>
                  <span className={styles['step-icon']}>💼</span>
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
          
          <div
            className={`${styles.card} ${styles['engine-card']}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <h3 className={styles['card-title']}>Gráfico de Mercado</h3>
            <div className={styles['engine-svg-wrapper']}>
              <svg width="200" height="200" className={styles['rotating-bolt']}>
                <line x1="50" y1="150" x2="150" y2="50" stroke="blue" strokeWidth="2" /> {/* Demanda */}
                <line x1="50" y1="50" x2="150" y2="150" stroke="red" strokeWidth="2" /> {/* Oferta */}
                <text x="100" y="180" textAnchor="middle" className={styles['svg-text']}>
                  Mercado
                </text>
              </svg>
            </div>
            <div className={styles['engine-status']}>
              {progress < 100 ? 'En Análisis' : '¡Transacción Completada! 📊'}
            </div>
            <div className={styles.status}>
              <p>
                <span className={`${styles['status-icon']} ${styles['status-ok']}`}>📈</span>
                Estado: {progress}% completado
              </p>
            </div>
          </div>
          
          <div className={`${styles.card} ${styles['toolbox-card']}`}>
            <h3 className={styles['card-title']}>Herramientas</h3>
            <div className={styles['tool-list']}>
              <div
                className={styles.tool}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'Aumentar Precio')}
              >
                Aumentar Precio
                <p className={styles['card-desc']}>Ajusta el precio al alza</p>
              </div>
              <div
                className={styles.tool}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'Disminuir Oferta')}
              >
                Disminuir Oferta
                <p className={styles['card-desc']}>Reduce la cantidad disponible</p>
              </div>
              <div
                className={styles.tool}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'Aumentar Demanda')}
              >
                Aumentar Demanda
                <p className={styles['card-desc']}>Incrementa el interés de compradores</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.message}>
          {progress === 100 && '¡Felicidades! Has completado la simulación económica.'}
        </div>
        
        <footer className={styles.footer}>
          Simulación creada con React y estilos personalizados.
        </footer>
        </div>
      </div>
    </div>
  );
}

export default EconomicsSimulation;