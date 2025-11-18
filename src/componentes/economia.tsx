// NetworkSimulation.tsx
import React, { useState, useEffect } from 'react';
import styles from '../engineWorkshop.module.css';
import appStyles from '../App.module.css';

// Interfaz para los pasos del proceso
interface Step {
  id: number;
  name: string;
  status: 'pending' | 'current' | 'completed';
}

// Datos iniciales de los pasos (Basados en el Handshake de 3 Vías de TCP y envío de datos)
const stepsData: Step[] = [
  { id: 1, name: 'SYN: Solicitud de Conexión', status: 'pending' },
  { id: 2, name: 'SYN-ACK: Aceptar y Sincronizar', status: 'pending' },
  { id: 3, name: 'ACK: Confirmación de Conexión', status: 'pending' },
  { id: 4, name: 'Envío de Paquetes de Datos', status: 'pending' },
];

function NetworkSimulation() {
  const [steps, setSteps] = useState<Step[]>(stepsData);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // Inicializa el primer paso como 'current' al cargar
  useEffect(() => {
    setSteps(prevSteps => {
      if (prevSteps.length > 0 && prevSteps[0].status === 'pending') {
        return [{ ...prevSteps[0], status: 'current' }, ...prevSteps.slice(1)];
      }
      return prevSteps;
    });
    setProgress(1 / stepsData.length * 100);
  }, []); // Se ejecuta solo una vez al montar

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
      
      const newIndex = currentStepIndex + 1;
      setSteps(updatedSteps);
      setCurrentStepIndex(newIndex);
      // El progreso se calcula como (pasos completados + paso actual) / total
      setProgress(((newIndex + 1) / steps.length) * 100);
    } else if (currentStepIndex === steps.length - 1) {
        // Último paso completado
        const updatedSteps: Step[] = steps.map((step, index) => {
            if (index === currentStepIndex) {
              return { ...step, status: 'completed' };
            }
            return step;
        });
        setSteps(updatedSteps);
        setCurrentStepIndex(currentStepIndex + 1); // Va más allá del índice
        setProgress(100);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tool: string) => {
    e.dataTransfer.setData('tool', tool);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles['drag-over']);
    const tool: string = e.dataTransfer.getData('tool');
    alert(`Herramienta "${tool}" aplicada. Esto afectaría la capa de Red. Resultado simulado.`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles['drag-over']);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove(styles['drag-over']);
  };
  
  // Lógica para el gráfico de las capas
  const getNetworkDiagram = () => {
      // Simulación visual simple del progreso de la comunicación
      const statusText = progress === 100 ? 'Conexión Establecida' : 'Proceso en curso...';
      const connectionLineColor = progress > 50 ? '#2ecc71' : '#f39c12';
      const serverColor = progress === 100 ? '#2ecc71' : '#9b59b6';
      
      return (
        <div className={styles['engine-svg-wrapper']}>
            <svg width="100%" height="200" viewBox="0 0 300 200">
                {/* Fondo simple de la topología */}
                <rect x="0" y="0" width="300" height="200" fill="#ecf0f1" rx="10"/>

                {/* Cliente (Origen) */}
                <circle cx="50" cy="100" r="30" fill="#3498db" stroke="#2c3e50" strokeWidth="3" />
                <text x="50" y="105" textAnchor="middle" fill="white" fontSize="14">Cliente</text>

                {/* Servidor (Destino) */}
                <rect x="220" y="70" width="60" height="60" fill={serverColor} stroke="#2c3e50" strokeWidth="3" rx="8" />
                <text x="250" y="105" textAnchor="middle" fill="white" fontSize="14">Servidor</text>

                {/* Línea de conexión/ruta */}
                <line x1="80" y1="100" x2="220" y2="100" stroke={connectionLineColor} strokeWidth="5" strokeDasharray="10 5" />
                
                {/* Indicador de Paquete/Progreso */}
                <circle 
                    cx={80 + (progress / 100) * (220 - 80)} // Mueve el paquete de 80 a 220
                    cy="100" 
                    r="8" 
                    fill="#e74c3c" 
                    stroke="white" 
                    strokeWidth="2"
                >
                    <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
                </circle>

                {/* Leyendas de Capas */}
                <text x="150" y="30" textAnchor="middle" fill="#2c3e50" fontSize="14" fontWeight="bold">
                    Capa de Transporte (TCP)
                </text>
                <text x="150" y="180" textAnchor="middle" fill="#2c3e50" fontSize="14" fontWeight="bold">
                    Capa de Internet (IP)
                </text>
            </svg>
            <div className={styles['engine-status']}>
                {statusText} {progress === 100 ? '✅' : '⏳'}
            </div>
        </div>
      );
  }

  return (
    <div className={appStyles.mainContainer}>
      <div className={styles.body}>
        <div className={styles['container main-content']}>
          <h2>Simulación de Redes: Handshake TCP/IP</h2>
          
          <div className={styles.grid}>
            
            <div className={`${styles.card} ${styles['steps-card']}`}>
              <h3 className={styles['card-title']}>Pasos del Protocolo (Handshake)</h3>
              <div className={styles['progress-container']}>
                <div className={styles['progress-label']}>
                  Progreso de Conexión: {Math.round(progress)}% <span className={styles['progress-icon']}>📡</span>
                </div>
                <div className={styles['progress-bar']}>
                  <div className={styles['progress-fill']} style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              <ul className={styles['steps-list']}>
                {steps.map((step: Step, index: number) => (
                  <li key={step.id} className={`${styles['steps-list']} ${styles[step.status]}`}>
                    <span className={styles['step-icon']}>
                        {step.id === 1 && '➡️'}
                        {step.id === 2 && '🔄'}
                        {step.id === 3 && '✅'}
                        {step.id === 4 && '📦'}
                    </span>
                    <strong>{step.name}</strong>
                    <p className={styles['card-desc']}>
                      {index === 0 && 'Cliente envía bandera SYN para sincronizar.'}
                      {index === 1 && 'Servidor responde con SYN-ACK.'}
                      {index === 2 && 'Cliente confirma conexión con ACK (establecida).'}
                      {index === 3 && 'Transferencia de datos iniciada.'}
                    </p>
                  </li>
                ))}
              </ul>
              <button
                className={styles['button']}
                onClick={handleNextStep}
                disabled={currentStepIndex >= steps.length}
              >
                {currentStepIndex >= steps.length -1 && progress < 100 ? 'Completar Simulación' : 'Siguiente Segmento'}
              </button>
            </div>
            
            <div
              className={`${styles.card} ${styles['engine-card']}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <h3 className={styles['card-title']}>Visualización de la Ruta de Red</h3>
              {getNetworkDiagram()}
              <div className={styles.status}>
                <p>
                  <span className={`${styles['status-icon']} ${styles['status-ok']}`}>📶</span>
                  Estado: {progress === 100 ? 'Conexión ACTIVA' : 'Analizando Paquetes'}
                </p>
              </div>
            </div>
            
            <div className={`${styles.card} ${styles['toolbox-card']}`}>
              <h3 className={styles['card-title']}>Herramientas de Diagnóstico</h3>
              <div className={styles['tool-list']}>
                <div
                  className={styles.tool}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, 'Ataque DDoS')}
                >
                  Ataque DDoS
                  <p className={styles['card-desc']}>Satura el ancho de banda del servidor.</p>
                </div>
                <div
                  className={styles.tool}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, 'Packet Sniffer')}
                >
                  Packet Sniffer
                  <p className={styles['card-desc']}>Captura e inspecciona el tráfico de datos.</p>
                </div>
                <div
                  className={styles.tool}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, 'Configurar Firewall')}
                >
                  Configurar Firewall
                  <p className={styles['card-desc']}>Aplica o bloquea puertos (capa de Transporte).</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.message}>
            {progress === 100 && '¡Transferencia Exitosa! El Handshake TCP/IP se ha completado.'}
          </div>
          
          <footer className={styles.footer}>
            Simulación de Protocolos de Red (TCP/IP) con React.
          </footer>
        </div>
      </div>
    </div>
  );
}

export default NetworkSimulation;