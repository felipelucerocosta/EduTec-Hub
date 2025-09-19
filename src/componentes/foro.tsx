import React, { useState, useEffect } from "react";
import styles from "./foro.module.css";
import Header2 from "../components reutilizables/header2"; 
import "boxicons/css/boxicons.min.css";

interface Mensaje {
  id: number;
  texto: string;
  fecha: string;
}

const Foro: React.FC = () => {
  const [mensaje, setMensaje] = useState<string>("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  // Cargar mensajes desde localStorage
  const cargarMensajes = () => {
    const data = localStorage.getItem("foro_mensajes");
    if (data) {
      setMensajes(JSON.parse(data));
    } else {
      setMensajes([]);
    }
  };

  // Guardar mensajes en localStorage
  const guardarMensajes = (mensajesActualizados: Mensaje[]) => {
    localStorage.setItem("foro_mensajes", JSON.stringify(mensajesActualizados));
    setMensajes(mensajesActualizados);
  };

  const enviarMensaje = () => {
    if (mensaje.trim() === "") return;
    const nuevoMensaje: Mensaje = {
      id: Date.now(),
      texto: mensaje.trim(),
      fecha: new Date().toLocaleString(),
    };
    const mensajesActualizados = [nuevoMensaje, ...mensajes];
    guardarMensajes(mensajesActualizados);
    setMensaje("");
  };

  // Borrar mensaje individual
  const eliminarMensaje = (id: number) => {
    const filtrados = mensajes.filter((m) => m.id !== id);
    guardarMensajes(filtrados);
  };

  useEffect(() => {
    cargarMensajes();
  }, []);

  return (
    <div className={styles.body}>
      <Header2 />

      <div className={styles.container}>
        <div className={styles["main-content"]}>
          <h2>FORO</h2>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            rows={6}
          />
          <button onClick={enviarMensaje}>Enviar</button>

          <div id="mensajes">
            {mensajes.length === 0 ? (
              <p className={styles["mensaje-vacio"]}>No hay mensajes</p>
            ) : (
              mensajes.map((m) => (
                <div key={m.id} className={styles["mensaje-item"]}>
                  <p>{m.texto}</p>
                  <div className={styles["mensaje-footer"]}>
                    <span>{m.fecha}</span>
                    <button
                      className={styles["btn-eliminar"]}
                      onClick={() => eliminarMensaje(m.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
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

export default Foro;