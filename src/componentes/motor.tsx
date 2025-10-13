import { useState, useEffect, useMemo, useCallback } from "react";
import type { DragEvent } from "react";
import styles from "../simulacion.module.css";  // Asegúrate de usar CSS Modules

interface Step {
  id: number;
  title: string;
  description: string;
  target: "cover" | "belt_old" | "belt_new" | "bolt" | "start";
  icon: string;  // Nuevo: icono para cada paso
}

interface EngineState {
  coverOpen: boolean;
  beltOld: boolean;
  beltNew: boolean;
  boltTightness: number;
  running: boolean;
}

export default function EngineWorkshop() {
  const steps = useMemo<Step[]>(() => [
    { id: 1, title: "Abrir la tapa del motor", description: "Haz click sobre la tapa superior para abrirla y acceder al interior.", target: "cover", icon: "🔓" },
    { id: 2, title: "Retirar la correa gastada", description: "Arrastra la correa vieja hacia afuera del compartimiento del motor.", target: "belt_old", icon: "🗑️" },
    { id: 3, title: "Colocar la correa nueva", description: "Arrastra la correa nueva desde la caja de herramientas hacia las poleas del motor.", target: "belt_new", icon: "🔄" },
    { id: 4, title: "Ajustar tornillos", description: "Mantén presionado el destornillador sobre el tornillo hasta que quede apretado.", target: "bolt", icon: "🔧" },
    { id: 5, title: "Encender el motor", description: "Presiona el botón de encendido para probar el funcionamiento.", target: "start", icon: "🚀" },
  ], []);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [engine, setEngine] = useState<EngineState>({
    coverOpen: false,
    beltOld: true,
    beltNew: false,
    boltTightness: 0,
    running: false,
  });
  const [message, setMessage] = useState<string>(steps[0].description);
  const [rotating, setRotating] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);  // Nuevo: para feedback drag

  const progress = ((completed.length / steps.length) * 100).toFixed(0);  // Barra de progreso

  // completeStep memorizado
  const completeStep = useCallback(() => {
    setCompleted((prev) => {
      if (!prev.includes(currentStep)) {
        const newCompleted = [...prev, currentStep];
        setCurrentStep(currentStep + 1);
        // Mensaje dinámico
        if (currentStep < steps.length - 1) {
          setMessage(`¡Paso ${currentStep + 1} completado! Siguiente: ${steps[currentStep + 1].title}`);
        } else {
          setMessage("¡Todos los pasos completados! 🎉");
        }
        return newCompleted;
      }
      return prev;
    });
  }, [currentStep, steps]);

  useEffect(() => {
    if (currentStep >= steps.length) {
      setMessage("¡Motor reparado con éxito! 🚗💨");
    } else if (currentStep < steps.length) {
      setMessage(steps[currentStep].description);
    }
  }, [currentStep, steps]);

  const handleCoverClick = () => {
    if (steps[currentStep].target === "cover") {
      setEngine((prev) => ({ ...prev, coverOpen: !prev.coverOpen }));
      completeStep();
    } else {
      setMessage("Completa los pasos en orden. Actual: " + steps[currentStep].title);
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, part: string) => {
    e.dataTransfer.setData("part", part);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  // Corrección: Renombrado a _e porque no se usa el parámetro
  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const part = e.dataTransfer.getData("part");
    if (steps[currentStep].target === part) {
      setEngine((prev) => {
        if (part === "belt_old") return { ...prev, beltOld: false };
        if (part === "belt_new") return { ...prev, beltNew: true };
        return prev;
      });
      completeStep();
    } else {
      setMessage("¡Ups! Este no es el paso actual. Intenta con: " + steps[currentStep].title);
    }
  };

  useEffect(() => {
    if (!rotating) return;
    const interval = setInterval(() => {
      setEngine((prev) => {
        const next = Math.min(prev.boltTightness + 5, 100);
        if (next === 100 && steps[currentStep].target === "bolt") completeStep();
        return { ...prev, boltTightness: next };
      });
    }, 200);
    return () => clearInterval(interval);
  }, [rotating, currentStep, steps, completeStep]);

  const handleStartEngine = () => {
    if (steps[currentStep].target === "start") {
      const ready = engine.coverOpen && !engine.beltOld && engine.beltNew && engine.boltTightness >= 100;
      setEngine((prev) => ({ ...prev, running: ready }));
      if (ready) {
        setMessage("¡El motor arranca perfectamente! 🚀🎉");
        completeStep();
      } else {
        setMessage("Falta completar algún paso antes de arrancar. Revisa el estado.");
      }
    } else {
      setMessage("Completa los pasos anteriores primero.");
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setCompleted([]);
    setEngine({ coverOpen: false, beltOld: true, beltNew: false, boltTightness: 0, running: false });
    setRotating(false);
    setMessage(steps[0].description);
    setDragOver(false);
  };

  const getStepClass = (index: number) => {
    if (completed.includes(index)) return styles.completed;
    if (index === currentStep) return styles.current;
    return styles.pending;
  };

  return (
    <div className={styles.body}>
      <div className={styles["container main-content"]}>
        <h2>Simulador: Reparación de Motor</h2>

        <div className={styles.grid}>
          {/* PASOS MEJORADOS */}
          <div className={styles["card steps-card"]}>
            <h3 className={styles["card-title"]}>Pasos a seguir</h3>
            
            {/* Barra de Progreso Nueva */}
            <div className={styles["progress-container"]} role="progressbar" aria-valuenow={parseInt(progress)} aria-valuemin={0} aria-valuemax={100}>
              <div className={styles["progress-label"]}>
                Progreso: {progress}% 
                <span className={styles["progress-icon"]}>{parseInt(progress) === 100 ? "✅" : "⏳"}</span>
              </div>
              <div className={styles["progress-bar"]}>
                <div 
                  className={styles["progress-fill"]} 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ol className={styles["steps-list"]}>
              {steps.map((step, index) => (
                <li key={index} className={getStepClass(index)}>
                  <span className={styles["step-icon"]}>
                    {completed.includes(index) ? "✅" : index === currentStep ? step.icon : "🔒"}
                  </span>
                  <strong>{step.title}</strong>
                  {index === currentStep && <p className={styles["card-desc"]}>{step.description}</p>}
                </li>
              ))}
            </ol>

            <div className={styles.status}>
              <p><span className={styles["status-icon"]}>🔓</span> Tapa: <span className={engine.coverOpen ? styles["status-ok"] : styles["status-pending"]}>{engine.coverOpen ? "Abierta ✅" : "Cerrada ❌"}</span></p>
              <p><span className={styles["status-icon"]}>🔄</span> Correa: <span className={engine.beltNew ? styles["status-ok"] : styles["status-pending"]}>{engine.beltNew ? "Nueva ✅" : "Vieja ❌"}</span></p>
              <p><span className={styles["status-icon"]}>🔧</span> Tornillo: <span className={engine.boltTightness >= 100 ? styles["status-ok"] : styles["status-pending"]}>{engine.boltTightness}% {engine.boltTightness >= 100 ? "Apretado ✅" : "Pendiente ❌"}</span></p>
            </div>
            <button className={styles.button} onClick={reset} aria-label="Reiniciar simulación">Reiniciar</button>
            <p className={styles.message}>{message}</p>
          </div>

          {/* MOTOR INTERACTIVO MEJORADO */}
          <div 
            className={`${styles["card engine-card"]} ${dragOver ? styles["drag-over"] : ""}`} 
            onDrop={handleDrop} 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <h3 className={styles["card-title"]}>Motor interactivo</h3>
            <div className={styles["engine-svg-wrapper"]}>
              <svg viewBox="0 0 250 150">
                {/* Cuerpo del motor */}
                <rect x="30" y="40" width="190" height="80" rx="10" fill="#333" stroke="#111" strokeWidth="2"/>
                
                {/* Tapa interactiva mejorada */}
                <g onClick={handleCoverClick} style={{ cursor: "pointer" }}>
                  <rect
                    x="40"
                    y="20"
                    width="170"
                    height="40"
                    rx="6"
                    fill={engine.coverOpen ? "#2d3748" : "#4b5563"}
                    stroke={currentStep === 0 ? "#3498db" : "#bdc3c7"}
                    strokeWidth={currentStep === 0 ? "3" : "1"}
                  />
                  <text x="125" y="45" textAnchor="middle" fill="white" fontSize="12" className={styles["svg-text"]}>Tapa</text>
                </g>
                
                {/* Poleas y correa mejorada */}
                <circle cx="190" cy="90" r="20" fill={engine.beltOld ? "#9b3412" : engine.beltNew ? "#d97706" : "transparent"} stroke="#000" strokeWidth="2"/>
                <circle cx="70" cy="90" r="20" fill={engine.beltOld ? "#9b3412" : engine.beltNew ? "#d97706" : "transparent"} stroke="#000" strokeWidth="2"/>
                {/* Línea de correa */}
                <line x1="90" y1="90" x2="170" y2="90" stroke={engine.beltNew ? "#d97706" : "#9b3412"} strokeWidth="4" opacity={engine.beltNew || engine.beltOld ? 1 : 0} />
                
                {/* Tornillo con rotación */}
                <rect x="120" y="60" width="10" height="40" fill="#ccc" />
                <circle 
                  cx="125" 
                  cy="100" 
                  r="6" 
                  fill="#6b7280" 
                  className={rotating ? styles["rotating-bolt"] : ""}
                  style={{ transform: `rotate(${engine.boltTightness * 3.6}deg)`, transformOrigin: "125px 100px" }}
                />
                
                {/* Etiqueta motor */}
                <text x="125" y="130" textAnchor="middle" fill="#666" fontSize="10">Motor</text>
              </svg>
            </div>

            <button
              className={styles["tornillo-button"]}
              onMouseDown={() => steps[currentStep].target === "bolt" && setRotating(true)}
              onMouseUp={() => setRotating(false)}
              onMouseLeave={() => setRotating(false)}
              aria-label={`Apretar tornillo al ${engine.boltTightness}%`}
              disabled={steps[currentStep].target !== "bolt"}
            >
              🔧 Tornillo {engine.boltTightness}%
            </button>

            <button className={styles["button start-button"]} onClick={handleStartEngine} disabled={steps[currentStep].target !== "start"}>
              🚀 Encender Motor
            </button>
            <p className={styles["engine-status"]}>{engine.running ? "Encendido 🔥" : "Apagado ⚫"}</p>
          </div>

          {/* HERRAMIENTAS */}
          <div className={styles["card toolbox-card"]}>
            <h3 className={styles["card-title"]}>Caja de herramientas</h3>
            <div className={styles["tool-list"]}>
              <div className={styles.tool} draggable={steps[currentStep].target === "belt_old"} onDragStart={(e) => handleDragStart(e, "belt_old")}>
                🗑️ Correa vieja
                <p className={styles["card-desc"]}>Arrástrala fuera del motor</p>
              </div>
              <div className={styles.tool} draggable={steps[currentStep].target === "belt_new"} onDragStart={(e) => handleDragStart(e, "belt_new")}>
                🔄 Correa nueva
                <p className={styles["card-desc"]}>Instálala en las poleas</p>
              </div>
              <div className={styles.tool}>
                🔧 Destornillador
                <p className={styles["card-desc"]}>Úsalo para apretar los tornillos</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>Simulación educativa de motor • Realismo mejorado e interfaz intuitiva</div>
      </div>
    </div>
  );
}