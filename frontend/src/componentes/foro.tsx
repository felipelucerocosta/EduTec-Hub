import React, { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import styles from "../foro.module.css";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";

const API_URL = "http://localhost:3001/api";
const SOCKET_URL = "http://localhost:3001";

interface Mensaje {
  id: number;
  mensaje: string;
  fecha: string;
  usuario?: string;
  usuario_id?: number | null;
  rol?: string;
}

const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return "";
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;

    return fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fechaStr;
  }
};

const Foro: React.FC = () => {
  const [mensaje, setMensaje] = useState<string>("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarMensajes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/mensajes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar mensajes");
      const data = await res.json();
      if (Array.isArray(data)) {
        setMensajes(data);
      }
      setError(null);
    } catch (err: any) {
      setError("No se pudieron cargar los mensajes. Verifica la conexión.");
    }
  }, []);

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
      const data = await res.json();
      setMensaje("");
      if (data.nuevoMensaje) {
        setMensajes((prev) => {
          if (prev.some((m) => m.id === data.nuevoMensaje.id)) return prev;
          return [data.nuevoMensaje, ...prev];
        });
      } else {
        await cargarMensajes();
      }
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

    // Socket.IO para actualización en tiempo real
    const socket: Socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("nuevo_mensaje", (nuevoMsg: Mensaje) => {
      setMensajes((prev) => {
        if (prev.some((m) => m.id === nuevoMsg.id)) return prev;
        return [nuevoMsg, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [cargarMensajes]);

  const currentClaseId = localStorage.getItem("current_clase_id");
  const currentClaseRole = localStorage.getItem("current_clase_role");
  const isAlumno = currentClaseRole === "alumno";

  const zonaTrabajoLink = currentClaseId
    ? isAlumno
      ? `/alumno/gestion/${currentClaseId}`
      : `/gestionClase/${currentClaseId}`
    : isAlumno
    ? "/alumno"
    : "/clases";

  const navLinks = [
    { label: "Zona de Trabajo", to: zonaTrabajoLink, icon: "bx-briefcase" },
    { label: "Calendario", to: "/calendario", icon: "bx-calendar" },
    { label: "Clases", to: isAlumno ? "/alumno" : "/clases", icon: "bx-book" },
  ];

  return (
    <div className={styles.body}>
      <Header navLinks={navLinks} />

      <div className={styles.container}>
        <main className={styles.mainContent}>
          <h1 className={styles.forumTitle}>Foro de Consultas</h1>
          <p className={styles.forumSubtitle}>
            Comparte tus dudas, debate con tus compañeros y recibe asistencia de los profesores en tiempo real.
          </p>

          {error && (
            <div
              style={{
                color: "#fb7185",
                background: "rgba(244, 63, 94, 0.1)",
                border: "1px solid rgba(244, 63, 94, 0.2)",
                borderRadius: "12px",
                padding: "0.85rem 1.25rem",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <i className="bx bx-error-circle" style={{ fontSize: "1.1rem" }}></i>
              {error}
            </div>
          )}

          <div className={styles.composerWrapper}>
            <textarea
              className={styles.textarea}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje aquí... (Presiona Enter para enviar)"
              rows={4}
              disabled={loading}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
              <Button
                onClick={enviarMensaje}
                disabled={loading || mensaje.trim() === ""}
                loading={loading}
                icon="bx-send"
              >
                Enviar Mensaje
              </Button>
            </div>
          </div>

          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#f1f5f9",
              marginBottom: "1rem",
              letterSpacing: "-0.01em",
            }}
          >
            Mensajes Recientes
          </h2>

          <div className={styles.mensajesList}>
            {mensajes.length > 0 ? (
              mensajes.map((item) => {
                const nombreUsuario = item.usuario || "Usuario";
                const inicial = nombreUsuario.charAt(0).toUpperCase();

                return (
                  <div key={item.id} className={styles.mensajeCard}>
                    <div className={styles.avatar}>{inicial}</div>
                    <div className={styles.mensajeContenido}>
                      <div className={styles.mensajeHeader}>
                        <strong className={styles.usuarioNombre}>{nombreUsuario}</strong>
                        {item.rol && <span className={styles.rolBadge}>{item.rol}</span>}
                        <span className={styles.mensajeFecha}>{formatearFecha(item.fecha)}</span>
                      </div>
                      <p className={styles.mensajeTexto}>{item.mensaje}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.mensajeVacio}>
                <i
                  className="bx bx-chat"
                  style={{
                    fontSize: "2rem",
                    color: "#334155",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                ></i>
                No hay mensajes aún. ¡Sé el primero en escribir!
              </div>
            )}
          </div>
        </main>

        <div className={styles.adminTitle}>— CANAL EDUCATIVO OFICIAL —</div>
      </div>

      <footer className={styles.footer}>
        <p>Edutech &copy; {new Date().getFullYear()} - Tablón de Consultas</p>
      </footer>
    </div>
  );
};

export default Foro;