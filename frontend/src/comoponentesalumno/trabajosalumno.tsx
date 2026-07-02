import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../materiales.module.css";
import Header from "../components reutilizables/header";
import Modal from "../components reutilizables/Modal";
import TareaDetalle from "../componentes/TareaDetalle";

const API_URL = "http://localhost:3001/api";

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  porcentaje?: number;
  bimestre?: number;
}

interface ClaseInfo {
  id: number;
  nombre: string;
  materia: string;
  aula: string;
  seccion: string;
  creador: string;
}

const TrabajosAlumno: React.FC = () => {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();

  const [claseInfo, setClaseInfo] = useState<ClaseInfo | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [loading, setLoading] = useState(true);

  const navLinks = [
    { label: "← Volver a Clases", to: "/alumno", icon: "bx-arrow-back" },
    { label: "Calendario", to: "/calendario", icon: "bx-calendar" },
    { label: "Foro", to: "/foro", icon: "bx-conversation" },
  ];

  // ── Fetch class info ───────────────────────────────────────
  const fetchClaseInfo = async () => {
    if (!claseId) return;
    try {
      const res = await fetch(`${API_URL}/alumno/mis-clases`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const found = Array.isArray(data) ? data.find((c: any) => String(c.id) === String(claseId)) : null;
        if (found) setClaseInfo(found);
      }
    } catch (err) {
      console.error("Error fetching clase info:", err);
    }
  };

  // ── Fetch tasks/materials for this class ───────────────────
  const fetchTareas = async () => {
    if (!claseId) return;
    try {
      const res = await fetch(`${API_URL}/materiales/${claseId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTareas(data.map((t: any) => ({
            id: t.id,
            titulo: t.titulo,
            descripcion: t.descripcion,
            fechaEntrega: t.fecha_entrega || t.fechaEntrega || "",
            porcentaje: t.porcentaje,
            bimestre: t.bimestre,
          })));
          return;
        }
      }
    } catch (err) {
      console.error("Error fetching tareas:", err);
    }
    setTareas([]);
  };

  useEffect(() => {
    if (claseId) {
      localStorage.setItem("current_clase_id", claseId);
      localStorage.setItem("current_clase_role", "alumno");
    }
    (async () => {
      setLoading(true);
      await Promise.all([fetchClaseInfo(), fetchTareas()]);
      setLoading(false);
    })();
  }, [claseId]);

  if (loading) {
    return (
      <div>
        <Header navLinks={navLinks} />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "#94a3b8", fontSize: "1.1rem" }}>
          <i className="bx bx-loader-alt bx-spin" style={{ marginRight: "0.5rem", fontSize: "1.4rem" }}></i>
          Cargando clase...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header navLinks={navLinks} />

      <main className={styles.contenedorPrincipal} style={{ maxWidth: "900px", margin: "6rem auto 2rem", padding: "0 1.5rem" }}>

        {/* ── Class header ── */}
        {claseInfo && (
          <div style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: "16px",
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#f1f5f9" }}>
                {claseInfo.nombre}
              </h1>
              <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: "0.88rem" }}>
                {claseInfo.materia} · {claseInfo.aula} · {claseInfo.seccion} · Docente: {claseInfo.creador}
              </p>
            </div>
            <button
              onClick={() => navigate("/alumno")}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
                borderRadius: "8px",
                padding: "0.4rem 1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.84rem"
              }}
            >
              <i className="bx bx-arrow-back"></i> Mis Clases
            </button>
          </div>
        )}

        {/* ── Tasks/Materials ── */}
        <section>
          <h2 style={{ margin: "0 0 1rem", color: "#f1f5f9", fontSize: "1.15rem", fontWeight: 700 }}>
            📚 Trabajos y Materiales
          </h2>

          {tareas.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "#64748b",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "12px",
              border: "1px dashed rgba(255,255,255,0.08)"
            }}>
              <i className="bx bx-file-blank" style={{ fontSize: "2.8rem", display: "block", marginBottom: "0.75rem", color: "#475569" }}></i>
              <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600 }}>Todavía no hay trabajos publicados.</p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem" }}>
                Cuando el docente suba materiales o trabajos, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {tareas.map((tarea) => (
                <div
                  key={tarea.id}
                  onClick={() => setTareaSeleccionada(tarea)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    cursor: "pointer",
                    transition: "background 0.2s, border-color 0.2s",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                >
                  <div>
                    <h4 style={{ margin: "0 0 0.3rem", color: "#f1f5f9", fontSize: "0.95rem" }}>{tarea.titulo}</h4>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>
                      {tarea.fechaEntrega ? `Entrega: ${tarea.fechaEntrega}` : "Sin fecha de entrega"}
                      {tarea.porcentaje ? ` · ${tarea.porcentaje}% de la nota` : ""}
                    </p>
                  </div>
                  <i className="bx bx-chevron-right" style={{ fontSize: "1.3rem", color: "#64748b", flexShrink: 0 }}></i>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Task detail modal ── */}
      {tareaSeleccionada && (
        <TareaDetalle
          tarea={tareaSeleccionada}
          onClose={() => setTareaSeleccionada(null)}
        />
      )}

      <footer style={{ textAlign: "center", padding: "2rem 1rem", color: "#475569", fontSize: "0.78rem" }}>
        <p>Derechos de autor © 2025 Edutech</p>
      </footer>
    </div>
  );
};

export default TrabajosAlumno;
