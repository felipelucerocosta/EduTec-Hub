import React, { useState, useEffect, useCallback } from "react";
import styles from "../foro.module.css";
import Header from "../components reutilizables/header";
import "boxicons/css/boxicons.min.css";

const API_URL = "http://localhost:3001/api";

const Foro: React.FC = () => {
  const [mensaje, setMensaje] = useState<string>("");
  const [tablonHtml, setTablonHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar mensajes desde el backend
  const cargarMensajes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/mensajes`);
      if (!res.ok) throw new Error("Error al cargar mensajes");
      const html = await res.text();
      setTablonHtml(html);
      setError(null);
    } catch (err: any) {
      setError("No se pudieron cargar los mensajes. Verifica la conexión con el servidor.");
    }
  }, []);

  // Enviar mensaje al backend
  const enviarMensaje = async () => {
    if (mensaje.trim() === "") return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/guardar-mensaje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mensaje: mensaje.trim() }),
      });
      if (!res.ok) throw new Error("Error al guardar el mensaje");
      setMensaje("");
      await cargarMensajes(); // Recargar el tablón después de guardar
    } catch (err: any) {
      setError("No se pudo enviar el mensaje. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  useEffect(() => {
    cargarMensajes();
    // Polling cada 15s para recibir nuevos mensajes
    const interval = setInterval(cargarMensajes, 15000);
    return () => clearInterval(interval);
  }, [cargarMensajes]);

  const navLinks = [
    { label: "Zona de Trabajo", to: "/gestionClase" },
    { label: "Calendario", to: "/calendario" },
    { label: "Clases", to: "/clases" },
  ];

  return (
    <div className={styles.body}>
      <Header navLinks={navLinks} />

      <div className={styles.container}>
        <div className={styles["main-content"]}>
          <h2>FORO</h2>

          {error && (
            <div style={{ color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginBottom: "1rem", fontSize: "0.9rem" }}>
              <i className="bx bx-error-circle" style={{ marginRight: "6px" }}></i>
              {error}
            </div>
          )}

          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje aquí... (Enter para enviar)"
            rows={6}
            disabled={loading}
          />
          <button onClick={enviarMensaje} disabled={loading || mensaje.trim() === ""}>
            {loading ? "Enviando..." : "Enviar"}
          </button>

          <div id="mensajes" style={{ marginTop: "1.5rem" }}>
            {tablonHtml ? (
              <div dangerouslySetInnerHTML={{ __html: tablonHtml }} />
            ) : (
              <p className={styles["mensaje-vacio"]}>No hay mensajes</p>
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