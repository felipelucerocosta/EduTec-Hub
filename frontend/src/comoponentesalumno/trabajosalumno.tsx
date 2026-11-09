import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components reutilizables/Button";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyState from "../components/ui/EmptyState";
import TareaDetalle from "../componentes/TareaDetalle";
import { API_URL } from "../config/api";

interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  instrucciones?: string;
  fecha_limite?: string;
  puntos_max?: number;
  mi_estado?: string;
  mi_entrega?: any;
}

interface Material {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo?: string;
  archivo_nombre?: string;
  archivo_path?: string;
  enlace?: string;
}

const TrabajosAlumno: React.FC = () => {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"trabajos" | "materiales" | "anuncios">("trabajos");
  const [claseInfo, setClaseInfo] = useState<any>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClaseData = async () => {
    if (!claseId) return;
    setLoading(true);

    try {
      // 1. Fetch class info
      const resClases = await fetch(`${API_URL}/alumno/mis-clases`, { credentials: "include" });
      if (resClases.ok) {
        const dataClases = await resClases.json();
        const found = Array.isArray(dataClases) ? dataClases.find((c: any) => String(c.id) === String(claseId)) : null;
        if (found) setClaseInfo(found);
      }

      // 2. Fetch assignments
      const resTrabajos = await fetch(`${API_URL}/clases/${claseId}/trabajos`, { credentials: "include" });
      if (resTrabajos.ok) {
        const dataTrabajos = await resTrabajos.json();
        setTareas(Array.isArray(dataTrabajos) ? dataTrabajos : []);
      }

      // 3. Fetch materials
      const resMat = await fetch(`${API_URL}/materiales/${claseId}`, { credentials: "include" });
      if (resMat.ok) {
        const dataMat = await resMat.json();
        setMateriales(Array.isArray(dataMat) ? dataMat : []);
      }

      // 4. Fetch announcements
      const resAnuncios = await fetch(`${API_URL}/mensajes?clase_id=${claseId}`, { credentials: "include" });
      if (resAnuncios.ok) {
        const dataAnuncios = await resAnuncios.json();
        setAnuncios(Array.isArray(dataAnuncios) ? dataAnuncios : []);
      }
    } catch (err) {
      console.error("Error al obtener datos de la clase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaseData();
  }, [claseId]);

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Class Header Banner */}
        <div style={{
          background: "rgba(255,255,255,0.038)",
          border: "1px solid rgba(124, 58, 237, 0.2)",
          borderRadius: "20px", padding: "1.75rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "1rem",
          boxShadow: "0 0 0 1px rgba(124,58,237,0.06) inset",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span className="badge badge-purple">{claseInfo?.materia || "Materia"}</span>
              {claseInfo?.codigo && <span className="badge badge-blue">Código: {claseInfo.codigo}</span>}
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
              {claseInfo?.nombre || "Cargando clase..."}
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginTop: "0.35rem" }}>
              Aula: {claseInfo?.aula || "S/D"} · {claseInfo?.seccion || ""} · Docente: {claseInfo?.creador || "Profesor"}
            </p>
          </div>

          <Button variant="outline" onClick={() => navigate("/alumno")} icon="bx-arrow-back">
            Mis Clases
          </Button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "0.2rem", borderBottom: "1px solid rgba(255,255,255,0.07)", overflowX: "auto" }}>
          {([
            { id: "trabajos", icon: "bx-task", label: "Trabajos", count: tareas.length },
            { id: "materiales", icon: "bx-folder", label: "Materiales", count: materiales.length },
            { id: "anuncios", icon: "bx-news", label: "Tablón", count: anuncios.length },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "0.65rem 1.1rem",
                  borderRadius: "8px 8px 0 0",
                  border: "1px solid",
                  borderColor: isActive ? "rgba(255,255,255,0.07) rgba(255,255,255,0.07) #7c3aed" : "transparent",
                  borderBottom: isActive ? "2px solid #7c3aed" : "2px solid transparent",
                  background: isActive ? "rgba(124,58,237,0.1)" : "transparent",
                  color: isActive ? "#f8fafc" : "#64748b",
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  whiteSpace: "nowrap",
                  position: "relative",
                  bottom: "-1px",
                  transition: "all 0.2s ease",
                }}
              >
                <i className={`bx ${tab.icon}`}></i> {tab.label} ({tab.count})
              </button>
            );
          })}
          <button
            onClick={() => navigate(`/simuladores/${claseId}`)}
            style={{
              padding: "0.65rem 1.1rem", borderRadius: "8px 8px 0 0",
              border: "1px solid transparent", borderBottom: "2px solid transparent",
              background: "transparent", color: "#38bdf8",
              fontFamily: "'Sora', sans-serif",
              fontWeight: 500, fontSize: "0.875rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            <i className="bx bx-atom"></i> Simuladores
          </button>
          <button
            onClick={() => navigate(`/boletin`)}
            style={{
              padding: "0.65rem 1.1rem", borderRadius: "8px 8px 0 0",
              border: "1px solid transparent", borderBottom: "2px solid transparent",
              background: "transparent", color: "#a78bfa",
              fontFamily: "'Sora', sans-serif",
              fontWeight: 500, fontSize: "0.875rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            <i className="bx bx-receipt"></i> Mi Boletín
          </button>
        </div>

        {/* Tab 1: Trabajos */}
        {activeTab === "trabajos" && (
          <div>
            {loading ? (
              <LoadingSkeleton type="list" count={3} />
            ) : tareas.length === 0 ? (
              <EmptyState
                icon="bx-task"
                title="Sin trabajos publicados"
                description="Tu profesor aún no ha publicado actividades en esta clase."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {tareas.map((tarea) => {
                  const estado = tarea.mi_estado || "sin_entregar";
                  return (
                    <div
                      key={tarea.id}
                      onClick={() => navigate(`/trabajo/${tarea.id}`)}
                      style={{
                        background: "rgba(255,255,255,0.038)",
                        border: "1px solid rgba(255,255,255,0.075)",
                        borderRadius: "14px", padding: "1rem 1.4rem",
                        cursor: "pointer", transition: "all 0.2s ease",
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", gap: "1rem",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
                        e.currentTarget.style.background = "rgba(124,58,237,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.075)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.038)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '12px',
                          background: estado === 'corregido' ? 'rgba(16, 185, 129, 0.15)' :
                                      estado === 'entregado' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: estado === 'corregido' ? '#34d399' :
                                 estado === 'entregado' ? '#a78bfa' : '#fbbf24',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
                        }}>
                          <i className={`bx ${
                            estado === 'corregido' ? 'bx-check-double' :
                            estado === 'entregado' ? 'bx-check' : 'bx-time'
                          }`}></i>
                        </div>
                        <div>
                          <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.25rem" }}>
                            {tarea.titulo}
                          </h4>
                          <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0 }}>
                            {tarea.fecha_limite
                              ? `Entrega: ${new Date(tarea.fecha_limite).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}`
                              : "Sin fecha de vencimiento"}
                            {tarea.puntos_max ? ` · ${tarea.puntos_max} pts` : " · 20 pts"}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {(tarea as any).calificacion !== undefined && (tarea as any).calificacion !== null && (
                          <span className="badge badge-green" style={{ fontWeight: 800 }}>
                            Nota: {(tarea as any).calificacion} / {tarea.puntos_max || 20}
                          </span>
                        )}
                        <span className={`badge ${
                          estado === 'corregido' ? 'badge-green' :
                          estado === 'entregado' ? 'badge-purple' :
                          estado === 'entrega_tardia' ? 'badge-rose' : 'badge-amber'
                        }`}>
                          {estado === 'corregido' ? 'Corregido' :
                           estado === 'entregado' ? 'Entregado' :
                           estado === 'entrega_tardia' ? 'Tardío' : 'Sin entregar'}
                        </span>
                        <i className="bx bx-chevron-right" style={{ fontSize: "1.4rem", color: "#64748b" }}></i>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Materiales */}
        {activeTab === "materiales" && (
          <div>
            {loading ? (
              <LoadingSkeleton type="list" count={2} />
            ) : materiales.length === 0 ? (
              <EmptyState
                icon="bx-folder"
                title="Sin materiales compartidos"
                description="No hay archivos ni guías subidas por el docente."
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {materiales.map((mat) => (
                  <div key={mat.id} style={{
                    background: "rgba(255,255,255,0.038)", border: "1px solid rgba(255,255,255,0.075)",
                    borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column",
                    justifyContent: "space-between", gap: "0.75rem"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <i className={`bx ${mat.enlace ? "bx-link" : "bx-file-pdf"}`} style={{ fontSize: "1.4rem", color: "#38bdf8" }}></i>
                        <span className="badge badge-blue">{mat.tipo || "Documento"}</span>
                      </div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.35rem" }}>
                        {mat.titulo}
                      </h4>
                      <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0 }}>
                        {mat.descripcion || "Recurso pedagógico"}
                      </p>
                    </div>
                    {mat.archivo_path && (
                      <a
                        href={`${API_URL}/materiales/descargar/${mat.archivo_path}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.35rem",
                          fontSize: "0.82rem", fontWeight: 600, color: "#38bdf8"
                        }}
                      >
                        <i className="bx bx-download"></i> Descargar Archivo
                      </a>
                    )}
                    {mat.enlace && (
                      <a
                        href={mat.enlace}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.35rem",
                          fontSize: "0.82rem", fontWeight: 600, color: "#38bdf8"
                        }}
                      >
                        <i className="bx bx-external-link"></i> Abrir Enlace
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Anuncios */}
        {activeTab === "anuncios" && (
          <div>
            {anuncios.length === 0 ? (
              <EmptyState
                icon="bx-conversation"
                title="Sin anuncios"
                description="El tablón de la clase está limpio."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {anuncios.map((anc) => (
                  <div key={anc.id} style={{
                    background: "rgba(255,255,255,0.038)", border: "1px solid rgba(255,255,255,0.075)",
                    borderRadius: "14px", padding: "1.25rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "#a78bfa", fontSize: "0.88rem" }}>
                        {anc.autor_nombre || "Profesor"}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {new Date(anc.fecha).toLocaleDateString("es-ES", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ color: "#e2e8f0", fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>
                      {anc.mensaje}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assignment Detail Modal */}
        {tareaSeleccionada && (
          <TareaDetalle
            tarea={tareaSeleccionada}
            onClose={() => setTareaSeleccionada(null)}
            onSubmitted={fetchClaseData}
          />
        )}

      </div>
    </AppLayout>
  );
};

export default TrabajosAlumno;
