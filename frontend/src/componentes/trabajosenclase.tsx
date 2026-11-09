import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import Modal from "../components reutilizables/Modal";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyState from "../components/ui/EmptyState";
import { useToast } from "../contexts/ToastContext";
import { API_URL, BACKEND_URL } from "../config/api";

interface Trabajo {
  id: number;
  titulo: string;
  descripcion?: string;
  instrucciones?: string;
  fecha_limite?: string;
  puntos_max?: number;
}

interface Material {
  id: number;
  titulo: string;
  descripcion?: string;
  archivo_nombre?: string;
  archivo_path?: string;
  enlace?: string;
}

interface Entrega {
  id: number;
  alumno_id: number;
  alumno_nombre: string;
  alumno_correo: string;
  archivo_nombre?: string;
  archivo_path?: string;
  comentario?: string;
  estado: string;
  calificacion?: number;
  feedback?: string;
  fecha_entrega: string;
}

const GestionClase: React.FC = () => {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"trabajos" | "materiales" | "alumnos" | "tablon">("trabajos");
  const [claseInfo, setClaseInfo] = useState<any>(null);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalNuevoTrabajo, setModalNuevoTrabajo] = useState(false);
  const [modalNuevoMaterial, setModalNuevoMaterial] = useState(false);
  const [modalNuevoAnuncio, setModalNuevoAnuncio] = useState(false);
  const [modalVerEntregas, setModalVerEntregas] = useState<{ open: boolean; trabajo?: Trabajo; entregas: Entrega[] }>({
    open: false, entregas: []
  });
  const [gradingEntrega, setGradingEntrega] = useState<Entrega | null>(null);
  const [gradeInput, setGradeInput] = useState<string>("");
  const [feedbackInput, setFeedbackInput] = useState<string>("");

  // Forms state
  const [nuevoTrabajo, setNuevoTrabajo] = useState({ titulo: "", descripcion: "", instrucciones: "", fecha_limite: "", puntos_max: 10 });
  const [nuevoMaterial, setNuevoMaterial] = useState({ titulo: "", descripcion: "", tipo: "documento", enlace: "" });
  const [archivoMaterial, setArchivoMaterial] = useState<File | null>(null);
  const [textoAnuncio, setTextoAnuncio] = useState("");

  const fetchClassAllData = async () => {
    if (!claseId) return;
    setLoading(true);
    try {
      // 1. Fetch class info
      const resClases = await fetch(`${API_URL}/clases`, { credentials: "include" });
      if (resClases.ok) {
        const dataClases = await resClases.json();
        const found = Array.isArray(dataClases) ? dataClases.find((c: any) => String(c.id) === String(claseId)) : null;
        if (found) setClaseInfo(found);
      }

      // 2. Fetch assignments
      const resTrabajos = await fetch(`${API_URL}/clases/${claseId}/trabajos`, { credentials: "include" });
      if (resTrabajos.ok) {
        const dataT = await resTrabajos.json();
        setTrabajos(Array.isArray(dataT) ? dataT : []);
      }

      // 3. Fetch materials
      const resMat = await fetch(`${API_URL}/materiales/${claseId}`, { credentials: "include" });
      if (resMat.ok) {
        const dataM = await resMat.json();
        setMateriales(Array.isArray(dataM) ? dataM : []);
      }

      // 4. Fetch real enrolled students
      const resAlumnos = await fetch(`${API_URL}/clases/${claseId}/alumnos`, { credentials: "include" });
      if (resAlumnos.ok) {
        const dataA = await resAlumnos.json();
        setAlumnos(Array.isArray(dataA) ? dataA : []);
      }

      // 5. Fetch announcements
      const resA = await fetch(`${API_URL}/mensajes?clase_id=${claseId}`, { credentials: "include" });
      if (resA.ok) {
        const dataA = await resA.json();
        setAnuncios(Array.isArray(dataA) ? dataA : []);
      }
    } catch (err) {
      console.error("Error al cargar datos de clase:", err);
      showToast("Error de conexión con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassAllData();
  }, [claseId]);

  // Create Assignment handler
  const handleCrearTrabajo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTrabajo.titulo.trim()) {
      showToast("El título es obligatorio.", "error");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/clases/${claseId}/trabajos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoTrabajo),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Trabajo creado exitosamente", "success");
        setModalNuevoTrabajo(false);
        setNuevoTrabajo({ titulo: "", descripcion: "", instrucciones: "", fecha_limite: "", puntos_max: 10 });
        await fetchClassAllData();
      } else {
        showToast(data.error || "Error al crear trabajo", "error");
      }
    } catch (err) {
      showToast("Error al conectar con el servidor", "error");
    }
  };

  // Create Material handler
  const handleCrearMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMaterial.titulo.trim()) {
      showToast("El título es obligatorio.", "error");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("clase_id", claseId || "");
      formData.append("titulo", nuevoMaterial.titulo);
      formData.append("descripcion", nuevoMaterial.descripcion);
      formData.append("tipo", nuevoMaterial.tipo);
      if (nuevoMaterial.enlace) formData.append("enlace", nuevoMaterial.enlace);
      if (archivoMaterial) formData.append("archivo", archivoMaterial);

      const res = await fetch(`${API_URL}/materiales`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Material publicado correctamente", "success");
        setModalNuevoMaterial(false);
        setNuevoMaterial({ titulo: "", descripcion: "", tipo: "documento", enlace: "" });
        setArchivoMaterial(null);
        await fetchClassAllData();
      } else {
        showToast(data.error || "Error al publicar material", "error");
      }
    } catch (err) {
      showToast("Error al conectar con el servidor", "error");
    }
  };

  // Post Announcement
  const handlePublicarAnuncio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoAnuncio.trim()) return;

    try {
      const res = await fetch(`${API_URL}/guardar-mensaje`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: textoAnuncio, clase_id: Number(claseId) }),
      });
      if (res.ok) {
        showToast("Anuncio publicado en el tablón", "success");
        setTextoAnuncio("");
        setModalNuevoAnuncio(false);
        await fetchClassAllData();
      }
    } catch (err) {
      showToast("Error al publicar anuncio", "error");
    }
  };

  // Fetch Submissions for assignment
  const handleVerEntregas = async (trabajo: Trabajo) => {
    try {
      const res = await fetch(`${API_URL}/trabajos/${trabajo.id}/entregas`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setModalVerEntregas({ open: true, trabajo, entregas: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      showToast("Error al obtener entregas", "error");
    }
  };

  // Grade Submission handler
  const handleGuardarCalificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingEntrega) return;

    const nota = parseFloat(gradeInput);
    const maxPts = modalVerEntregas.trabajo?.puntos_max || 20;
    if (isNaN(nota) || nota < 0 || nota > maxPts) {
      showToast(`Ingresa una calificación válida entre 0 y ${maxPts}`, "error");
      return;
    }

    try {
      const endpoint = gradingEntrega.id || (gradingEntrega as any).entrega_id
        ? `${API_URL}/entregas/${gradingEntrega.id || (gradingEntrega as any).entrega_id}/calificar`
        : `${API_URL}/trabajos/${modalVerEntregas.trabajo?.id}/alumnos/${gradingEntrega.alumno_id}/calificar`;

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: nota, feedback: feedbackInput }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Calificación guardada correctamente", "success");
        setGradingEntrega(null);
        if (modalVerEntregas.trabajo) {
          handleVerEntregas(modalVerEntregas.trabajo);
        }
      } else {
        showToast(data.error || "Error al calificar", "error");
      }
    } catch (err) {
      showToast("Error al guardar la calificación", "error");
    }
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Class Banner Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(56, 189, 248, 0.15))",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          borderRadius: "20px", padding: "1.75rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "1rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span className="badge badge-purple">{claseInfo?.materia || "Materia"}</span>
              {claseInfo?.codigo && <span className="badge badge-blue">Código: {claseInfo.codigo}</span>}
              <span className="badge badge-amber">Docente</span>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
              {claseInfo?.nombre || "Gestión de Clase"}
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginTop: "0.35rem" }}>
              Aula: {claseInfo?.aula || "S/D"} · {claseInfo?.seccion || ""} · Alumnos: {alumnos.length}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button variant="outline" onClick={() => navigate("/clases")} icon="bx-arrow-back">
              Mis Clases
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem", overflowX: "auto" }}>
          <button
            onClick={() => setActiveTab("trabajos")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "trabajos" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "trabajos" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "trabajos" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-task"></i> Trabajos ({trabajos.length})
          </button>
          <button
            onClick={() => setActiveTab("materiales")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "materiales" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "materiales" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "materiales" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-folder"></i> Materiales ({materiales.length})
          </button>
          <button
            onClick={() => setActiveTab("alumnos")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "alumnos" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "alumnos" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "alumnos" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-group"></i> Alumnos ({alumnos.length})
          </button>
          <button
            onClick={() => setActiveTab("tablon")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "tablon" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "tablon" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "tablon" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-news"></i> Tablón ({anuncios.length})
          </button>
          <button
            onClick={() => navigate(`/simuladores/${claseId}`)}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8",
              fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-atom"></i> Simuladores
          </button>
          <button
            onClick={() => navigate(`/rendimiento`)}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: "rgba(16, 185, 129, 0.1)", color: "#34d399",
              fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-bar-chart-alt-2"></i> Rendimiento Curso
          </button>
        </div>

        {/* Tab 1: Trabajos */}
        {activeTab === "trabajos" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#f8fafc" }}>Trabajos Prácticos</h3>
              <Button onClick={() => setModalNuevoTrabajo(true)} icon="bx-plus">
                Crear Trabajo
              </Button>
            </div>

            {loading ? (
              <LoadingSkeleton type="list" count={3} />
            ) : trabajos.length === 0 ? (
              <EmptyState
                icon="bx-task"
                title="No has publicado trabajos"
                description="Crea actividades y asignaciones con fechas límite para que tus alumnos las entreguen."
                actionLabel="Crear Nuevo Trabajo"
                onAction={() => setModalNuevoTrabajo(true)}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {trabajos.map((tr) => (
                  <div key={tr.id} style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-color)",
                    borderRadius: "14px", padding: "1.15rem 1.5rem", display: "flex",
                    justifyContent: "space-between", alignItems: "center", gap: "1rem"
                  }}>
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.25rem" }}>
                        {tr.titulo}
                      </h4>
                      <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0 }}>
                        {tr.fecha_limite ? `Vence: ${new Date(tr.fecha_limite).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}` : "Sin fecha límite"}
                        {tr.puntos_max ? ` · Puntos máx: ${tr.puntos_max}` : ""}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Button variant="primary" onClick={() => navigate(`/gestionClase/${claseId}/trabajo/${tr.id}`)} icon="bx-task">
                        Ver Entregas y Calificar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Materiales */}
        {activeTab === "materiales" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#f8fafc" }}>Materiales de Estudio</h3>
              <Button onClick={() => setModalNuevoMaterial(true)} icon="bx-plus">
                Publicar Material
              </Button>
            </div>

            {loading ? (
              <LoadingSkeleton type="card" count={2} />
            ) : materiales.length === 0 ? (
              <EmptyState
                icon="bx-folder"
                title="Sin materiales compartidos"
                description="Sube guías en PDF, presentaciones o enlaces para que la clase consulte."
                actionLabel="Publicar Material"
                onAction={() => setModalNuevoMaterial(true)}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {materiales.map((m) => (
                  <div key={m.id} style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-color)",
                    borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column",
                    justifyContent: "space-between", gap: "0.75rem"
                  }}>
                    <div>
                      <span className="badge badge-blue" style={{ marginBottom: "0.5rem" }}>{m.archivo_nombre ? "Archivo" : "Enlace"}</span>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.35rem" }}>
                        {m.titulo}
                      </h4>
                      <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0 }}>
                        {m.descripcion || "Sin descripción"}
                      </p>
                    </div>
                    {m.archivo_path && (
                      <a href={`${API_URL}/materiales/descargar/${m.archivo_path}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.82rem", color: "#38bdf8", fontWeight: 600 }}>
                        <i className="bx bx-download"></i> Descargar
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Alumnos */}
        {activeTab === "alumnos" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: 0 }}>Alumnos Inscriptos ({alumnos.length})</h3>
              {claseInfo?.codigo && (
                <span className="badge badge-blue">Código de Matriculación: {claseInfo.codigo}</span>
              )}
            </div>

            {alumnos.length === 0 ? (
              <EmptyState
                icon="bx-group"
                title="Sin alumnos matriculados"
                description={`Comparte el código #${claseInfo?.codigo || ""} para que los alumnos se unan a esta clase.`}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
                {alumnos.map((a, i) => (
                  <div key={i} style={{
                    background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem"
                  }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                      fontWeight: 700, fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {a.nombre ? a.nombre.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.nombre}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                        <i className="bx bx-envelope" style={{ marginRight: "4px" }}></i>
                        {a.correo || "Sin correo"}
                      </div>
                      {a.DNI && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                          DNI: {a.DNI}
                        </div>
                      )}
                      <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="badge badge-green" style={{ fontSize: "0.68rem", padding: "2px 8px" }}>
                          {a.estado || "Inscripto"}
                        </span>
                        {a.fecha_union && (
                          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                            {new Date(a.fecha_union).toLocaleDateString("es-ES")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Tablón */}
        {activeTab === "tablon" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#f8fafc" }}>Anuncios de la Clase</h3>
              <Button onClick={() => setModalNuevoAnuncio(true)} icon="bx-plus">
                Publicar Anuncio
              </Button>
            </div>

            {anuncios.length === 0 ? (
              <EmptyState
                icon="bx-news"
                title="Sin avisos todavía"
                description="Publica novedades o avisos urgentes para los alumnos de esta materia."
                actionLabel="Publicar Anuncio"
                onAction={() => setModalNuevoAnuncio(true)}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {anuncios.map((anc) => (
                  <div key={anc.id} style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-color)",
                    borderRadius: "14px", padding: "1.25rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 700, color: "#a78bfa", fontSize: "0.88rem" }}>
                        {anc.autor_nombre || "Docente"}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {new Date(anc.fecha).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                    <p style={{ color: "#e2e8f0", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
                      {anc.mensaje}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Crear Trabajo */}
        <Modal isOpen={modalNuevoTrabajo} onClose={() => setModalNuevoTrabajo(false)} title="Nuevo Trabajo Práctico">
          <form onSubmit={handleCrearTrabajo} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <InputField
              label="Título del trabajo"
              placeholder="Ej: TP 1 - Redes de Computadoras"
              value={nuevoTrabajo.titulo}
              onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, titulo: e.target.value })}
              icon="bx-edit"
              required
            />
            <textarea
              placeholder="Descripción breve..."
              value={nuevoTrabajo.descripcion}
              onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, descripcion: e.target.value })}
              rows={2}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem 1rem", color: "#f1f5f9", fontSize: "0.88rem" }}
            />
            <textarea
              placeholder="Instrucciones pormenorizadas para la entrega..."
              value={nuevoTrabajo.instrucciones}
              onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, instrucciones: e.target.value })}
              rows={3}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem 1rem", color: "#f1f5f9", fontSize: "0.88rem" }}
            />
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <InputField
                  label="Fecha Límite"
                  type="datetime-local"
                  value={nuevoTrabajo.fecha_limite}
                  onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, fecha_limite: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <InputField
                  label="Puntos Máximos"
                  type="number"
                  value={String(nuevoTrabajo.puntos_max)}
                  onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, puntos_max: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button type="submit" style={{ width: "100%", marginTop: "0.5rem" }}>
              Publicar Trabajo
            </Button>
          </form>
        </Modal>

        {/* Modal: Publicar Material */}
        <Modal isOpen={modalNuevoMaterial} onClose={() => setModalNuevoMaterial(false)} title="Publicar Material">
          <form onSubmit={handleCrearMaterial} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <InputField
              label="Título"
              placeholder="Ej: Apunte de Cátedra - Unidad 2"
              value={nuevoMaterial.titulo}
              onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, titulo: e.target.value })}
              icon="bx-book"
              required
            />
            <InputField
              label="Enlace web (opcional)"
              placeholder="https://..."
              value={nuevoMaterial.enlace}
              onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, enlace: e.target.value })}
              icon="bx-link"
            />
            <div>
              <label style={{ fontSize: "0.84rem", color: "#94a3b8", display: "block", marginBottom: "0.35rem" }}>Adjuntar Archivo</label>
              <input type="file" onChange={(e) => e.target.files && setArchivoMaterial(e.target.files[0])} style={{ color: "#94a3b8" }} />
            </div>
            <Button type="submit" style={{ width: "100%", marginTop: "0.5rem" }}>
              Publicar Material
            </Button>
          </form>
        </Modal>

        {/* Modal: Publicar Anuncio */}
        <Modal isOpen={modalNuevoAnuncio} onClose={() => setModalNuevoAnuncio(false)} title="Nuevo Anuncio">
          <form onSubmit={handlePublicarAnuncio} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <textarea
              placeholder="Escribe el mensaje para el tablón..."
              value={textoAnuncio}
              onChange={(e) => setTextoAnuncio(e.target.value)}
              rows={4}
              required
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem 1rem", color: "#f1f5f9", fontSize: "0.9rem" }}
            />
            <Button type="submit" style={{ width: "100%" }}>
              Publicar en el Tablón
            </Button>
          </form>
        </Modal>

        {/* Modal: Ver Entregas de Alumnos */}
        <Modal
          isOpen={modalVerEntregas.open}
          onClose={() => setModalVerEntregas({ open: false, entregas: [] })}
          title={`Entregas: ${modalVerEntregas.trabajo?.titulo || ""}`}
        >
          {modalVerEntregas.entregas.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "2rem 0" }}>
              Ningún alumno ha entregado este trabajo todavía.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {modalVerEntregas.entregas.map((ent, idx) => (
                <div key={ent.id || `ent-${ent.alumno_id}-${idx}`} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px", padding: "1.1rem", display: "flex", flexDirection: "column", gap: "0.6rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.95rem" }}>{ent.alumno_nombre}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{ent.alumno_correo}</div>
                    </div>
                    <span className={`badge ${
                      ent.estado === 'corregido' ? 'badge-green' :
                      ent.estado === 'entregado' ? 'badge-purple' :
                      ent.estado === 'entrega_tardia' ? 'badge-rose' : 'badge-amber'
                    }`}>
                      {ent.estado === 'corregido' ? `Calificado: ${ent.calificacion}/${modalVerEntregas.trabajo?.puntos_max || 20}` :
                       ent.estado === 'entregado' ? 'Entregado' :
                       ent.estado === 'entrega_tardia' ? 'Tardío' : 'Sin entregar'}
                    </span>
                  </div>

                  {ent.fecha_entrega && (
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      <i className="bx bx-time" style={{ marginRight: "0.3rem" }}></i>
                      Entregado: {new Date(ent.fecha_entrega).toLocaleString("es-ES")}
                    </div>
                  )}

                  {ent.archivo_nombre && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <a
                        href={`${BACKEND_URL}/uploads/${ent.archivo_path}`}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: "0.84rem", color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, textDecoration: "none" }}
                      >
                        <i className="bx bx-file" style={{ fontSize: "1.1rem" }}></i> {ent.archivo_nombre}
                      </a>
                    </div>
                  )}

                  {ent.comentario && (
                    <p style={{ fontSize: "0.82rem", color: "#cbd5e1", margin: 0, fontStyle: "italic", background: "rgba(255,255,255,0.02)", padding: "0.4rem 0.6rem", borderRadius: "6px" }}>
                      "{ent.comentario}"
                    </p>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGradingEntrega(ent);
                        setGradeInput(ent.calificacion !== null && ent.calificacion !== undefined ? String(ent.calificacion) : "");
                        setFeedbackInput(ent.feedback || "");
                      }}
                      style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem" }}
                    >
                      {ent.estado === 'corregido' ? 'Editar Nota' : 'Calificar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* Modal: Formulario para Calificar */}
        {gradingEntrega && (
          <Modal isOpen={true} onClose={() => setGradingEntrega(null)} title={`Calificar: ${gradingEntrega.alumno_nombre}`}>
            <form onSubmit={handleGuardarCalificacion} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>{gradingEntrega.alumno_nombre}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{gradingEntrega.alumno_correo}</div>
                {gradingEntrega.comentario && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                    "{gradingEntrega.comentario}"
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Nota / Calificación (0 a {modalVerEntregas.trabajo?.puntos_max || 20}):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={modalVerEntregas.trabajo?.puntos_max || 20}
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    placeholder={`0 - ${modalVerEntregas.trabajo?.puntos_max || 20}`}
                    required
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1.5px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(gradeInput) || 0;
                        const next = Math.max(0, current - 1);
                        setGradeInput(String(next));
                      }}
                      style={{
                        padding: '0.7rem 0.9rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Bajar 1 punto"
                    >
                      <i className="bx bx-minus"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(gradeInput) || 0;
                        const max = modalVerEntregas.trabajo?.puntos_max || 20;
                        const next = Math.min(max, current + 1);
                        setGradeInput(String(next));
                      }}
                      style={{
                        padding: '0.7rem 0.9rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Subir 1 punto"
                    >
                      <i className="bx bx-plus"></i>
                    </button>
                  </div>
                </div>

                {/* Quick grade selector chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                  {[0, 5, 10, 12, 14, 16, 18, 20].filter(n => n <= (modalVerEntregas.trabajo?.puntos_max || 20)).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGradeInput(String(n))}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        background: gradeInput === String(n) ? 'rgba(124, 58, 237, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                        border: gradeInput === String(n) ? '1px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: gradeInput === String(n) ? '#c4b5fd' : '#94a3b8',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Feedback / Devolución:
                </label>
                <textarea
                  placeholder="Devolución / Feedback pedagógico para el alumno..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    padding: "0.75rem 1rem",
                    color: "#f1f5f9",
                    fontSize: "0.9rem",
                    resize: "vertical",
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="secondary" onClick={() => setGradingEntrega(null)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Guardar Calificación
                </Button>
              </div>
            </form>
          </Modal>
        )}

      </div>
    </AppLayout>
  );
};

export default GestionClase;
