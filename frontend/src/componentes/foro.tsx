import React, { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import styles from "../foro.module.css";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components reutilizables/Button";

import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { API_URL, SOCKET_URL } from "../config/api";

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
  const { user } = useAuth();
  const [mensaje, setMensaje] = useState<string>("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permite tanto a alumnos como a docentes y admins ver el tablón de sus clases asignadas

  const cargarMensajes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/mensajes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar mensajes");
      const data = await res.json();
      setMensajes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error("Error al obtener mensajes:", err);
      setError("No se pudieron cargar los mensajes del foro.");
    }
  }, []);

  useEffect(() => {
    cargarMensajes();

    const socket: Socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("🟢 Conectado al Socket del Foro");
    });

    socket.on("nuevo_mensaje", (nuevoMsg: Mensaje) => {
      setMensajes((prev) => [nuevoMsg, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [cargarMensajes]);

  const currentClaseId = localStorage.getItem("current_clase_id");
  const isAlumno = user?.rol === "alumno";

  const activeClaseLink = currentClaseId
    ? (isAlumno ? `/alumno/gestion/${currentClaseId}` : `/gestionClase/${currentClaseId}`)
    : (isAlumno ? "/alumno" : "/clases");

  const enviarMensaje = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const texto = mensaje.trim();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/guardar-mensaje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mensaje: texto }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar el mensaje");
      }

      setMensaje("");
    } catch (err: any) {
      console.error("Error al enviar mensaje:", err);
      setError(err.message || "Error al enviar mensaje");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className={styles.body} style={{ padding: 0, minHeight: 'auto', background: 'transparent' }}>
        <div className={styles.container} style={{ maxWidth: '100%', padding: 0 }}>
          <main className={styles.mainContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h1 className={styles.forumTitle}>Foro de Consultas</h1>
                <p className={styles.forumSubtitle}>
                  Comparte tus dudas, debate con tus compañeros y recibe asistencia de los profesores en tiempo real.
                </p>
              </div>

              {currentClaseId && (
                <Link
                  to={activeClaseLink}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "10px",
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <i className="bx bx-left-arrow-alt"></i> Volver a la Clase Activa
                </Link>
              )}
            </div>

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

            {/* Input Form */}
            <div className={styles.inputContainer}>
              <form onSubmit={enviarMensaje} className={styles.inputForm}>
                <div style={{ flex: 1 }}>
                  <textarea
                    className={styles.textarea}
                    placeholder="Escribe tu consulta o mensaje para la comunidad..."
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    disabled={loading}
                    rows={3}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button type="submit" loading={loading} icon="bx-send" disabled={!mensaje.trim()}>
                    Publicar Consulta
                  </Button>
                </div>
              </form>
            </div>

            {/* Message Feed */}
            <div className={styles.messageFeed}>
              {mensajes.length === 0 ? (
                <div className={styles.emptyState} style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                  <i className="bx bx-conversation" style={{ fontSize: "3rem", color: "#64748b" }}></i>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", margin: "0.75rem 0 0.25rem 0" }}>
                    No hay contenido para mostrar
                  </h3>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.92rem" }}>
                    No tenés clases asignadas, por lo tanto no hay contenido para mostrar.
                  </p>
                </div>
              ) : (
                mensajes.map((msg) => {
                  const esProfesor = msg.rol === "profesor" || msg.rol === "admin";
                  const esMiMensaje = user && msg.usuario_id === user.id;

                  return (
                    <div
                      key={msg.id}
                      className={`${styles.messageCard} ${esProfesor ? styles.messageTeacher : ""} ${
                        esMiMensaje ? styles.messageOwn : ""
                      }`}
                    >
                      <div className={styles.messageHeader}>
                        <div className={styles.userInfo}>
                          <div className={`${styles.avatar} ${esProfesor ? styles.avatarTeacher : ""}`}>
                            {msg.usuario ? msg.usuario.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <span className={styles.userName}>{msg.usuario || "Usuario"}</span>
                            {msg.rol && (
                              <span
                                className={`badge ${
                                  msg.rol === "profesor"
                                    ? "badge-purple"
                                    : msg.rol === "admin"
                                    ? "badge-amber"
                                    : "badge-green"
                                }`}
                                style={{ marginLeft: "0.5rem", fontSize: "0.7rem", padding: "2px 8px" }}
                              >
                                {msg.rol}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={styles.messageTime}>{formatearFecha(msg.fecha)}</span>
                      </div>
                      <div className={styles.messageContent}>
                        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.mensaje}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>
    </AppLayout>
  );
};

export default Foro;