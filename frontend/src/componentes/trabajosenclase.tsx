import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import Modal from "../components reutilizables/Modal";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyState from "../components/ui/EmptyState";
import { useToast } from "../contexts/ToastContext";

const API_URL = "http://localhost:3001/api";

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
  const [gradeInput, setGradeInput] = useState<number>(100);
  const [feedbackInput, setFeedbackInput] = useState<string>("");

  // Forms state
  const [nuevoTrabajo, setNuevoTrabajo] = useState({ titulo: "", descripcion: "", instrucciones: "", fecha_limite: "", puntos_max: 100 });
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

      // 4. Fetch students
      const resSolicitudes = await fetch(`${API_URL}/campus/solicitudes/${claseId}`, { credentials: "include" });
      if (resSolicitudes.ok) {
        const dataS = await resSolicitudes.json();
        const aprobados = (dataS.solicitudes || [])
          .filter((s: any) => s.estado === "aprobado")
          .map((s: any) => ({ id: s.profesor_id, nombre: s.nombre || `Alumno #${s.profesor_id}`, correo: s.correo }));
        setAlumnos(aprobados);
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
        setNuevoTrabajo({ titulo: "", descripcion: "", instrucciones: "", fecha_limite: "", puntos_max: 100 });
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

    try {
      const res = await fetch(`${API_URL}/entregas/${gradingEntrega.id}/calificar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: gradeInput, feedback: feedbackInput }),
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
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("trabajos")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "trabajos" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "trabajos" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "trabajos" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem"
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
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem"
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
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem"
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
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem"
            }}
          >
            <i className="bx bx-news"></i> Tablón ({anuncios.length})
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
                      <Button variant="secondary" onClick={() => handleVerEntregas(tr)} icon="bx-check-square">
                        Ver Entregas
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
                      <a href={`http://localhost:3001/api/materiales/descargar/${m.archivo_path}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.82rem", color: "#38bdf8", fontWeight: 600 }}>
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
            <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "1rem" }}>Alumnos Inscriptos</h3>
            {alumnos.length === 0 ? (
              <EmptyState
                icon="bx-group"
                title="Sin alumnos matriculados"
                description={`Comparte el código #${claseInfo?.codigo || ""} para que los alumnos se unan a esta clase.`}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                {alumnos.map((a, i) => (
                  <div key={i} style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-color)",
                    borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem"
                  }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                      fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {a.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.88rem" }}>{a.nombre}</div>
                      {a.correo && <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{a.correo}</div>}
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
              {modalVerEntregas.entregas.map((ent) => (
                <div key={ent.id} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.9rem" }}>{ent.alumno_nombre}</span>
                    <span className={`badge ${ent.estado === 'corregido' ? 'badge-green' : 'badge-purple'}`}>
                      {ent.estado === 'corregido' ? `Calificado: ${ent.calificacion}/100` : 'Pendiente de Corrección'}
                    </span>
                  </div>

                  {ent.archivo_nombre && (
                    <a
                      href={`http://localhost:3001/api/entregas/descargar/${ent.archivo_path}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: "0.82rem", color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    >
                      <i className="bx bx-file"></i> {ent.archivo_nombre}
                    </a>
                  )}

                  {ent.comentario && (
                    <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
                      "{ent.comentario}"
                    </p>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => {
                      setGradingEntrega(ent);
                      setGradeInput(ent.calificacion || 100);
                      setFeedbackInput(ent.feedback || "");
                    }}
                    style={{ alignSelf: "flex-end", marginTop: "0.25rem", padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}
                  >
                    {ent.estado === 'corregido' ? 'Editar Nota' : 'Calificar'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* Modal: Formulario para Calificar */}
        {gradingEntrega && (
          <Modal isOpen={true} onClose={() => setGradingEntrega(null)} title={`Calificar: ${gradingEntrega.alumno_nombre}`}>
            <form onSubmit={handleGuardarCalificacion} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <InputField
                label="Nota / Calificación (0-100)"
                type="number"
                min="0" max="100"
                value={String(gradeInput)}
                onChange={(e) => setGradeInput(Number(e.target.value))}
                required
              />
              <textarea
                placeholder="Devolución / Feedback pedagógico para el alumno..."
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                rows={4}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem 1rem", color: "#f1f5f9", fontSize: "0.88rem" }}
              />
              <Button type="submit" style={{ width: "100%" }}>
                Guardar Calificación
              </Button>
            </form>
          </Modal>
        )}

      </div>
    </AppLayout>
  );
};

export default GestionClase;
