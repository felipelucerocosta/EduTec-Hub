import React, { useState, useEffect, useCallback } from "react";
import styles from "../calendario.module.css";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import Modal from "../components reutilizables/Modal";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API_URL = "http://localhost:3001/api";

interface Nota {
  id_nota: number;
  titulo: string;
  descripcion?: string;
  fecha_evento: string;
}

interface CalendarioCell {
  numero: number;
  isCurrentMonth: boolean;
  fecha: Date;
}

export default function Calendario() {
  const { user } = useAuth();
  const hoy = new Date();
  const [mes, setMes] = useState<number>(hoy.getMonth());
  const [anio, setAnio] = useState<number>(hoy.getFullYear());
  const [notas, setNotas] = useState<Nota[]>([]);
  const [textoNota, setTextoNota] = useState<string>("");
  const [diaNota, setDiaNota] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "" }>({ msg: "", type: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<CalendarioCell | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const cargarNotas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/calendario/notas`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Inicia sesión para ver tus notas del calendario.");
          return;
        }
        throw new Error("Error al cargar notas");
      }
      const data = await res.json();
      setNotas(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError("No se pudieron cargar las notas.");
    }
  }, []);

  useEffect(() => {
    cargarNotas();
  }, [cargarNotas]);

  const cambiarMes = (valor: number) => {
    let nuevoMes = mes + valor;
    let nuevoAnio = anio;
    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
  };

  const agregarNota = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!textoNota || !diaNota) return;

    const fecha_evento = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(diaNota).padStart(2, "0")}`;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/calendario/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ titulo: textoNota, descripcion: "", fecha_evento }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al guardar la nota");
      }
      setTextoNota("");
      setDiaNota("");
      setModalOpen(false);
      showToast("Nota agregada correctamente.", "success");
      await cargarNotas();
    } catch (err: any) {
      showToast(err.message || "Error al guardar la nota.", "error");
    } finally {
      setLoading(false);
    }
  };

  const eliminarNota = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/calendario/notas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar nota");
      showToast("Nota eliminada correctamente.", "success");
      await cargarNotas();
    } catch (err: any) {
      showToast("No se pudo eliminar la nota.", "error");
    }
  };

  const obtenerDiasCalendario = () => {
    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const totalDiasMes = new Date(anio, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(anio, mes, 0).getDate();

    const dias = [];

    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      dias.push({
        numero: totalDiasMesAnterior - i,
        isCurrentMonth: false,
        fecha: new Date(anio, mes - 1, totalDiasMesAnterior - i),
      });
    }

    for (let i = 1; i <= totalDiasMes; i++) {
      dias.push({
        numero: i,
        isCurrentMonth: true,
        fecha: new Date(anio, mes, i),
      });
    }

    const celdasRestantes = 42 - dias.length;
    for (let i = 1; i <= celdasRestantes; i++) {
      dias.push({
        numero: i,
        isCurrentMonth: false,
        fecha: new Date(anio, mes + 1, i),
      });
    }

    return dias;
  };

  const nombreMes = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date(anio, mes));

  useEffect(() => {
    document.title = `Calendario - ${nombreMes} ${anio}`;
  }, [nombreMes, anio]);

  const currentClaseId = localStorage.getItem("current_clase_id");
  const isAlumno = user?.rol === "alumno";

  const activeClaseLink = currentClaseId
    ? (isAlumno ? `/alumno/gestion/${currentClaseId}` : `/gestionClase/${currentClaseId}`)
    : (isAlumno ? "/alumno" : "/clases");

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <AppLayout>
      <div className={styles.calBody} style={{ padding: 0, minHeight: 'auto', background: 'transparent' }}>
        {toast.msg && (
          <div style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "0.75rem 1.5rem",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "0.88rem",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: toast.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
            border: toast.type === "success" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(244, 63, 94, 0.3)",
            color: toast.type === "success" ? "#34d399" : "#fb7185",
            backdropFilter: "blur(8px)"
          }}>
            <i className={`bx ${toast.type === "success" ? "bx-check-circle" : "bx-error-circle"}`}></i>
            {toast.msg}
          </div>
        )}

        {error && (
          <div style={{
            color: "#fb7185",
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
            borderRadius: "12px",
            padding: "0.85rem 1.25rem",
            fontSize: "0.88rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <i className="bx bx-error-circle" style={{ fontSize: "1.1rem" }}></i>
            {error}
          </div>
        )}

        <main className={styles.calContent} style={{ maxWidth: "100%", padding: 0 }}>
          {/* Navigation & Header */}
          <section className={styles.calHeader} style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button className={styles.calNavBtn} onClick={() => cambiarMes(-1)}>
                <i className="bx bx-chevron-left"></i>
              </button>
              <h2 className={styles.calMonthTitle} style={{ textTransform: "capitalize" }}>
                {`${nombreMes} ${anio}`}
              </h2>
              <button className={styles.calNavBtn} onClick={() => cambiarMes(1)}>
                <i className="bx bx-chevron-right"></i>
              </button>
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
          </section>

          {/* Quick event form */}
          <div style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px",
            padding: "1.5rem",
            marginBottom: "2rem"
          }}>
            <form onSubmit={agregarNota} style={{
              display: "flex",
              gap: "1rem",
              alignItems: "flex-end",
              flexWrap: "wrap"
            }}>
              <div style={{ flex: "2 1 280px" }}>
                <InputField
                  label="Nueva Nota / Tarea"
                  placeholder="Escribe el recordatorio aquí..."
                  value={textoNota}
                  onChange={(e) => setTextoNota(e.target.value)}
                  icon="bx-edit"
                  required
                  disabled={loading}
                />
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <InputField
                  label="Día del mes"
                  placeholder="Ej: 15"
                  type="number"
                  min="1"
                  max="31"
                  value={diaNota}
                  onChange={(e) => setDiaNota(e.target.value)}
                  icon="bx-calendar-alt"
                  required
                  disabled={loading}
                />
              </div>
              <div style={{ flex: "0 0 auto", height: "42px" }}>
                <Button type="submit" loading={loading} icon="bx-plus" style={{ height: "42px" }}>
                  Agregar Nota
                </Button>
              </div>
            </form>
          </div>

          {/* Calendar Grid */}
          <div className={styles.calGrid}>
            <div className={styles.calDaysHeader}>
              {diasSemana.map((day) => (
                <div key={day} className={styles.calDayLabel}>
                  {day}
                </div>
              ))}
            </div>

            <div className={styles.calCells}>
              {obtenerDiasCalendario().map((cell, idx) => {
                const notasDelDia = notas.filter((n) => {
                  const f = new Date(n.fecha_evento);
                  return (
                    f.getUTCDate() === cell.numero &&
                    f.getUTCMonth() === cell.fecha.getMonth() &&
                    f.getUTCFullYear() === cell.fecha.getFullYear()
                  );
                });

                const esHoy =
                  hoy.getDate() === cell.numero &&
                  hoy.getMonth() === cell.fecha.getMonth() &&
                  hoy.getFullYear() === cell.fecha.getFullYear() &&
                  cell.isCurrentMonth;

                const cellClasses = `${styles.calCell} ${!cell.isCurrentMonth ? styles.calCellOtherMonth : ""} ${esHoy ? styles.calCellToday : ""}`;

                return (
                  <div
                    key={idx}
                    className={cellClasses}
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        setSelectedCell(cell);
                        setDiaNota(String(cell.numero));
                        setModalOpen(true);
                      }
                    }}
                  >
                    <div className={styles.calCellDay}>{cell.numero}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {notasDelDia.map((n, index) => {
                        const colors = [styles.calEventPurple, styles.calEventCyan, styles.calEventAmber];
                        const eventColorClass = colors[index % colors.length];

                        return (
                          <div
                            key={n.id_nota}
                            className={`${styles.calEvent} ${eventColorClass}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarNota(n.id_nota, e);
                            }}
                            title="Haz clic para borrar nota"
                          >
                            {n.titulo} <span style={{ marginLeft: "4px", opacity: 0.8 }}>✕</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Modal para Agregar/Gestionar Notas */}
        {selectedCell && (
          <Modal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedCell(null);
              setTextoNota("");
            }}
            title={`Recordatorios para el ${selectedCell.numero} de ${nombreMes}`}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#94a3b8", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Notas Asignadas
                </h4>
                {notas.filter((n) => {
                  const f = new Date(n.fecha_evento);
                  return (
                    f.getUTCDate() === selectedCell.numero &&
                    f.getUTCMonth() === selectedCell.fecha.getMonth() &&
                    f.getUTCFullYear() === selectedCell.fecha.getFullYear()
                  );
                }).length === 0 ? (
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem", fontStyle: "italic" }}>
                    No hay notas para este día.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {notas
                      .filter((n) => {
                        const f = new Date(n.fecha_evento);
                        return (
                          f.getUTCDate() === selectedCell.numero &&
                          f.getUTCMonth() === selectedCell.fecha.getMonth() &&
                          f.getUTCFullYear() === selectedCell.fecha.getFullYear()
                        );
                      })
                      .map((n) => (
                        <div
                          key={n.id_nota}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            padding: "0.6rem 0.85rem",
                            borderRadius: "10px",
                          }}
                        >
                          <span style={{ color: "#f1f5f9", fontSize: "0.9rem" }}>{n.titulo}</span>
                          <button
                            onClick={(e) => {
                              eliminarNota(n.id_nota, e);
                              const remaining = notas.filter((val) => {
                                const f = new Date(val.fecha_evento);
                                return (
                                  f.getUTCDate() === selectedCell.numero &&
                                  f.getUTCMonth() === selectedCell.fecha.getMonth() &&
                                  f.getUTCFullYear() === selectedCell.fecha.getFullYear() &&
                                  val.id_nota !== n.id_nota
                                );
                              });
                              if (remaining.length === 0) {
                                setModalOpen(false);
                              }
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#fb7185",
                              cursor: "pointer",
                              fontSize: "1.1rem",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="Eliminar recordatorio"
                          >
                            <i className="bx bx-trash"></i>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.06)", margin: 0 }} />

              <form onSubmit={agregarNota} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <InputField
                  label="Nuevo Recordatorio / Actividad"
                  placeholder="Escribe el recordatorio aquí..."
                  value={textoNota}
                  onChange={(e) => setTextoNota(e.target.value)}
                  icon="bx-edit"
                  required
                  disabled={loading}
                  autoFocus
                />
                <Button type="submit" loading={loading} icon="bx-plus" style={{ width: "100%" }}>
                  Agregar Nota
                </Button>
              </form>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}
