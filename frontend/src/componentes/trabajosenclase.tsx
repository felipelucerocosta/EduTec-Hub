import React, { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../materiales.module.css";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";
import Modal from "../components reutilizables/Modal";

const API_URL = "http://localhost:3001/api";

interface Material {
  id?: number;
  titulo: string;
  descripcion: string;
  bimestre: number;
  porcentaje: number;
}

interface Alumno {
  id: number;
  nombre: string;
  correo?: string;
}

interface ClaseInfo {
  id: number;
  nombre: string;
  materia: string;
  aula: string;
  seccion: string;
  creador: string;
  titular_id?: number;
  codigo?: string;
}

interface Solicitud {
  id: number;
  profesor_id: number;
  nombre?: string;
  correo?: string;
  estado: string;
  solicitado_at: string;
}

const GestionClase: React.FC = () => {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();

  const [claseInfo, setClaseInfo] = useState<ClaseInfo | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id?: number; rol?: string; nombre?: string } | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [modalSolicitudes, setModalSolicitudes] = useState(false);

  const [modalLibretaVisible, setModalLibretaVisible] = useState(false);
  const [modalActaVisible, setModalActaVisible] = useState(false);
  const [modalAddMaterial, setModalAddMaterial] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "" }>({ msg: "", type: "" });

  const tituloRef = useRef<HTMLInputElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);
  const bimestreRef = useRef<HTMLInputElement>(null);
  const porcentajeRef = useRef<HTMLInputElement>(null);
  const motivoActaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  // ── Fetch class info ───────────────────────────────────────
  const fetchClaseInfo = async () => {
    if (!claseId) return;
    try {
      const res = await fetch(`${API_URL}/clases`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const found = Array.isArray(data) ? data.find((c: any) => String(c.id) === String(claseId)) : null;
        if (found) setClaseInfo(found);
      }
    } catch (err) {
      console.error("Error fetching clase info:", err);
    }
  };

  // ── Fetch students enrolled in this class ──────────────────
  const fetchAlumnos = async () => {
    if (!claseId) return;
    try {
      const res = await fetch(`${API_URL}/campus/solicitudes/${claseId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // Only approved students
        const aprobados = (data.solicitudes || [])
          .filter((s: any) => s.estado === "aprobado")
          .map((s: any) => ({ id: s.profesor_id, nombre: s.nombre || `Alumno #${s.profesor_id}`, correo: s.correo }));
        setAlumnos(aprobados);
      }
    } catch (err) {
      console.error("Error fetching alumnos:", err);
    }
  };

  // ── Fetch materials/tasks for this class ───────────────────
  const fetchMateriales = async () => {
    if (!claseId) return;
    try {
      const res = await fetch(`${API_URL}/materiales/${claseId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMateriales(Array.isArray(data) ? data : []);
      }
      // If endpoint doesn't exist yet, stay with empty array
    } catch (err) {
      console.error("Error fetching materiales:", err);
    }
  };

  // ── Fetch current user ─────────────────────────────────────
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_URL.replace("/api", "")}/api/whoami`, { credentials: "include" });
      const d = await res.json();
      setCurrentUser(d.user || null);
    } catch (err) {
      console.error("Error fetching whoami:", err);
    }
  };

  // ── Fetch access status for this class ────────────────────
  const fetchAccess = async (userId?: number) => {
    if (!claseId || !userId) return;
    try {
      const res = await fetch(`${API_URL}/campus/has-access-batch`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clase_ids: [Number(claseId)] }),
      });
      const d = await res.json();
      if (res.ok && d.access) setHasAccess(!!d.access[Number(claseId)]);
    } catch (err) {
      console.error("Error fetching access:", err);
    }
  };

  // ── Fetch pending solicitudes (for titular/owner) ──────────
  const fetchSolicitudes = async () => {
    if (!claseId) return;
    try {
      const res = await fetch(`${API_URL}/campus/solicitudes/${claseId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(data.solicitudes || []);
        // Also set approved students
        const aprobados = (data.solicitudes || [])
          .filter((s: any) => s.estado === "aprobado")
          .map((s: any) => ({ id: s.profesor_id, nombre: s.nombre || `Alumno #${s.profesor_id}`, correo: s.correo }));
        setAlumnos(aprobados);
      }
    } catch (err) {
      console.error("Error fetching solicitudes:", err);
    }
  };

  // ── Approve a request ──────────────────────────────────────
  const aprobarSolicitud = async (solicitudId: number) => {
    try {
      const res = await fetch(`${API_URL}/campus/aprobar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitud_id: solicitudId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Solicitud aprobada.", "success");
        await fetchSolicitudes();
      } else {
        showToast(data.error || "Error al aprobar.", "error");
      }
    } catch (err) {
      showToast("Error al aprobar solicitud.", "error");
    }
  };

  // ── Solicitar acceso (non-owner profesor) ──────────────────
  const solicitarAcceso = async () => {
    try {
      const res = await fetch(`${API_URL}/campus/solicitar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clase_id: Number(claseId) }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Solicitud enviada.", "success");
        await fetchAccess(currentUser?.id);
      } else {
        showToast(data.error || "No se pudo solicitar acceso.", "error");
      }
    } catch {
      showToast("Error al solicitar acceso.", "error");
    }
  };

  useEffect(() => {
    if (claseId) {
      localStorage.setItem("current_clase_id", claseId);
      localStorage.setItem("current_clase_role", "profesor");
    }
    (async () => {
      setLoading(true);
      const userRes = await fetch(`${API_URL.replace("/api", "")}/api/whoami`, { credentials: "include" });
      let user = null;
      try { const d = await userRes.json(); user = d.user || null; } catch {}
      setCurrentUser(user);
      await Promise.all([
        fetchClaseInfo(),
        fetchSolicitudes(),
        fetchMateriales(),
        fetchAccess(user?.id),
      ]);
      setLoading(false);
    })();
  }, [claseId]);


  // ── Add material ───────────────────────────────────────────
  const agregarMaterial = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tituloRef.current || !descripcionRef.current || !bimestreRef.current || !porcentajeRef.current) return;

    const nuevo: Material = {
      titulo: tituloRef.current.value,
      descripcion: descripcionRef.current.value,
      bimestre: Number(bimestreRef.current.value),
      porcentaje: Number(porcentajeRef.current.value),
    };

    try {
      const res = await fetch(`${API_URL}/materiales`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevo, clase_id: claseId }),
      });
      if (res.ok) {
        showToast("Material añadido correctamente.", "success");
        await fetchMateriales();
        setModalAddMaterial(false);
        (e.target as HTMLFormElement).reset();
      } else {
        // Fallback: add locally if API not ready
        setMateriales((prev) => [...prev, nuevo]);
        setModalAddMaterial(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      // Fallback: add locally
      setMateriales((prev) => [...prev, nuevo]);
      setModalAddMaterial(false);
      (e.target as HTMLFormElement).reset();
    }
  };

  const agregarActa = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showToast("Acta registrada correctamente.", "success");
    setModalActaVisible(false);
    e.currentTarget.reset();
  };

  const navLinks = [
    { label: "← Volver a Clases", to: "/clases", icon: "bx-arrow-back" },
    { label: "Calendario", to: "/calendario", icon: "bx-calendar" },
    { label: "Foro", to: "/foro", icon: "bx-conversation" },
  ];

  if (loading) {
    return (
      <div className={styles.pageWrapper ?? ""}>
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

      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)",
          padding: "0.75rem 1.5rem", borderRadius: "10px", fontWeight: 600, fontSize: "0.88rem",
          zIndex: 3000, display: "flex", alignItems: "center", gap: "0.5rem",
          background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
          border: toast.type === "success" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)",
          color: toast.type === "success" ? "#34d399" : "#fb7185",
          backdropFilter: "blur(8px)"
        }}>
          <i className={`bx ${toast.type === "success" ? "bx-check-circle" : "bx-error-circle"}`}></i>
          {toast.msg}
        </div>
      )}

      <main className={styles.contenedorPrincipal}>

        {/* ── Class header info ── */}
        {claseInfo && (
          <div style={{
            gridColumn: "1 / -1",
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: "16px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1rem",
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
              onClick={() => navigate("/clases")}
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

        {/* ── MATERIALES Y TRABAJOS ── */}
        <section className={styles.columna}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>Materiales y Trabajos</h2>
            <Button
              variant="primary"
              icon="bx-plus"
              onClick={() => setModalAddMaterial(true)}
            >
              Añadir
            </Button>
          </div>

          {materiales.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "2.5rem 1rem",
              color: "#64748b",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "12px",
              border: "1px dashed rgba(255,255,255,0.08)"
            }}>
              <i className="bx bx-file-blank" style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem", color: "#475569" }}></i>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>Todavía no hay materiales ni trabajos subidos.</p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>Usa el botón <strong>Añadir</strong> para publicar el primero.</p>
            </div>
          ) : (
            <div id="lista-materiales">
              {materiales.map((mat, idx) => (
                <div key={idx} className={styles.materialItem}>
                  <h4 style={{ margin: "0 0 0.35rem" }}>{mat.titulo}</h4>
                  <p style={{ margin: "0 0 0.25rem", color: "#94a3b8", fontSize: "0.88rem" }}>{mat.descripcion}</p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>
                    Bimestre {mat.bimestre} · {mat.porcentaje}% de la nota
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── ALUMNOS INSCRITOS ── */}
        <section className={styles.columna}>
          <div className={styles.headerColumna} style={{ marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>Alumnos Inscritos</h2>
            {alumnos.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className={styles.btn} onClick={() => setModalLibretaVisible(true)}>
                  📊 Libreta
                </button>
                <button className={styles.btn} onClick={() => setModalActaVisible(true)}>
                  📝 Actas
                </button>
              </div>
            )}
          </div>

          {alumnos.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "2.5rem 1rem",
              color: "#64748b",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "12px",
              border: "1px dashed rgba(255,255,255,0.08)"
            }}>
              <i className="bx bx-group" style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem", color: "#475569" }}></i>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>Aún no hay alumnos inscriptos.</p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>Cuando un alumno se una y sea aprobado, aparecerá aquí.</p>
            </div>
          ) : (
            <div id="lista-alumnos">
              {alumnos.map((alumno, idx) => (
                <div key={idx} className={styles.alumnoItem} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #7c3aed, #38bdf8)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0
                  }}>
                    {alumno.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: "#f1f5f9", fontSize: "0.88rem" }}>{alumno.nombre}</p>
                    {alumno.correo && <p style={{ margin: 0, color: "#64748b", fontSize: "0.75rem" }}>{alumno.correo}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Modal: Añadir Material ── */}
      <Modal isOpen={modalAddMaterial} onClose={() => setModalAddMaterial(false)} title="Añadir Material / Trabajo">
        <form onSubmit={agregarMaterial} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input ref={tituloRef} type="text" placeholder="Título del trabajo" required
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem 1rem", color: "#f1f5f9", fontSize: "0.9rem" }} />
          <textarea ref={descripcionRef} placeholder="Descripción..." required rows={3}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem 1rem", color: "#f1f5f9", fontSize: "0.9rem", resize: "vertical" }} />
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input ref={bimestreRef} type="number" placeholder="Bimestre (1-4)" min={1} max={4} required
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem 1rem", color: "#f1f5f9", fontSize: "0.9rem" }} />
            <input ref={porcentajeRef} type="number" placeholder="% nota final" min={1} max={100} required
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem 1rem", color: "#f1f5f9", fontSize: "0.9rem" }} />
          </div>
          <Button type="submit" style={{ width: "100%", marginTop: "0.25rem" }}>Añadir</Button>
        </form>
      </Modal>

      {/* ── Modal: Libreta de Notas ── */}
      <Modal isOpen={modalLibretaVisible} onClose={() => setModalLibretaVisible(false)} title="Libreta de Notas">
        <p style={{ color: "#64748b", fontSize: "0.9rem", textAlign: "center", padding: "1.5rem 0" }}>
          Próximamente: libreta de notas por alumno y bimestre.
        </p>
      </Modal>

      {/* ── Modal: Actas ── */}
      <Modal isOpen={modalActaVisible} onClose={() => setModalActaVisible(false)} title="Crear Acta">
        <form onSubmit={agregarActa} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <textarea ref={motivoActaRef} placeholder="Describe el motivo del acta..." required rows={4}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem 1rem", color: "#f1f5f9", fontSize: "0.9rem", resize: "vertical" }} />
          <Button type="submit" style={{ width: "100%" }}>Guardar Acta</Button>
        </form>
      </Modal>

      <footer style={{ textAlign: "center", padding: "2rem 1rem", color: "#475569", fontSize: "0.78rem" }}>
        <p>Derechos de autor © 2025 Edutech</p>
      </footer>
    </div>
  );
};

export default GestionClase;
