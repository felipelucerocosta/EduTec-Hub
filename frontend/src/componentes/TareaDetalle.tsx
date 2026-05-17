// TareaDetalle.tsx
import React, { useRef } from "react";
import styles from "../materiales.module.css";

interface Props {
  tarea: {
    id: number;
    titulo: string;
    descripcion: string;
    fechaEntrega: string;
    porcentaje?: number; // porcentaje de la nota final
  };
  onClose: () => void;
}

const TareaDetalle: React.FC<Props> = ({ tarea, onClose }) => {
  const archivoRef = useRef<HTMLInputElement>(null);

  const entregarTarea = () => {
    alert(`Tarea "${tarea.titulo}" entregada`);
  };

  const subirArchivo = () => {
    if (archivoRef.current?.files?.[0]) {
      const file = archivoRef.current.files[0];
      alert(`Archivo "${file.name}" subido para "${tarea.titulo}"`);
    } else {
      alert("Selecciona un archivo primero");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContenido}>
        <button className={styles.modalCerrar} onClick={onClose}>
          &times;
        </button>
        <h2>{tarea.titulo}</h2>
        <p>{tarea.descripcion}</p>
        <p>
          <strong>Fecha de entrega:</strong> {tarea.fechaEntrega}
        </p>
        {typeof tarea.porcentaje === 'number' && (
          <p>
            <strong>Porcentaje:</strong> {tarea.porcentaje}%
          </p>
        )}

        <div className={styles.formGestion}>
          <button
            onClick={entregarTarea}
            className={`${styles.btn} ${styles.btnPrincipal}`}
          >
            Entregar Tarea
          </button>

          <div className={styles.uploadBox}>
            <input type="file" ref={archivoRef} />
            <button
              onClick={subirArchivo}
              className={`${styles.btn} ${styles.btnPrincipal}`}
            >
              Subir Archivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TareaDetalle;
