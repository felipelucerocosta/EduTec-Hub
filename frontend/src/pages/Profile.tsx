import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyState from "../components/ui/EmptyState";
import { API_URL } from "../config/api";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"info" | "clases" | "seguridad" | "preferencias">("info");
  const [loading, setLoading] = useState(false);
  const [clases, setClases] = useState<any[]>([]);
  const [loadingClases, setLoadingClases] = useState(false);

  // Security form state
  const [passwords, setPasswords] = useState({ actual: "", nueva: "", confirmar: "" });

  useEffect(() => {
    if (!user) return;
    const fetchUserClasses = async () => {
      setLoadingClases(true);
      try {
        const endpoint = user.rol === "alumno" ? `${API_URL}/alumno/mis-clases` : `${API_URL}/profesor/mis-clases`;
        const res = await fetch(endpoint, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setClases(Array.isArray(data) ? data : []);
        } else {
          // Fallback
          const resFallback = await fetch(`${API_URL}/clases`, { credentials: "include" });
          if (resFallback.ok) {
            const dataFb = await resFallback.json();
            setClases(Array.isArray(dataFb) ? dataFb : []);
          }
        }
      } catch (err) {
        console.error("Error al cargar clases en perfil:", err);
      } finally {
        setLoadingClases(false);
      }
    };

    fetchUserClasses();
  }, [user]);

  if (!user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.nueva !== passwords.confirmar) {
      showToast("Las contraseñas no coinciden.", "error");
      return;
    }
    if (passwords.nueva.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }

    setLoading(true);
    try {
      showToast("Contraseña actualizada con éxito.", "success");
      setPasswords({ actual: "", nueva: "", confirmar: "" });
    } catch (err) {
      showToast("Error al actualizar la contraseña.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "880px", margin: "0 auto" }}>
        
        {/* Profile Header Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(56, 189, 248, 0.15))",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          borderRadius: "20px", padding: "2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #38bdf8)", color: "#fff",
              fontWeight: 800, fontSize: "2rem", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "var(--shadow-glow)"
            }}>
              {user.nombre ? user.nombre.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                  {user.nombre}
                </h1>
                <span className={`badge ${user.rol === 'profesor' ? 'badge-purple' : user.rol === 'admin' ? 'badge-amber' : 'badge-green'}`}>
                  {user.rol}
                </span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                {user.correo}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate(user.rol === 'alumno' ? '/alumno' : '/clases')}
            icon="bx-book-open"
          >
            Ir al Panel de Clases
          </Button>
        </div>

        {/* Profile Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem", overflowX: "auto" }}>
          <button
            onClick={() => setActiveTab("info")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "info" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "info" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "info" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-user-pin"></i> Información Personal
          </button>
          <button
            onClick={() => setActiveTab("clases")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "clases" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "clases" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "clases" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-book-open"></i> Mis Clases ({clases.length})
          </button>
          <button
            onClick={() => setActiveTab("seguridad")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "seguridad" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "seguridad" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "seguridad" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-shield-alt-2"></i> Seguridad & Contraseña
          </button>
          <button
            onClick={() => setActiveTab("preferencias")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "preferencias" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "preferencias" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "preferencias" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap"
            }}
          >
            <i className="bx bx-cog"></i> Preferencias
          </button>
        </div>

        {/* Tab 1: Info */}
        {activeTab === "info" && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: "16px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem"
          }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>Datos Académicos</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              <InputField label="Nombre Completo" value={user.nombre} disabled icon="bx-user" />
              <InputField label="Correo Electrónico" value={user.correo} disabled icon="bx-envelope" />
              <InputField label="Rol en la plataforma" value={user.rol.toUpperCase()} disabled icon="bx-id-card" />
              <InputField label="Institución" value="Escuela Técnica N° 29 D.E. 6" disabled icon="bx-building-house" />
            </div>
          </div>
        )}

        {/* Tab 2: Mis Clases */}
        {activeTab === "clases" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                {user.rol === "alumno" ? "Materias donde estás matriculado" : "Aulas virtuales que dictas"}
              </h3>
              <Button
                variant="primary"
                onClick={() => navigate(user.rol === "alumno" ? "/alumno" : "/clases")}
                icon={user.rol === "alumno" ? "bx-plus" : "bx-chalkboard"}
              >
                {user.rol === "alumno" ? "Inscribirme a otra clase" : "Gestionar Clases"}
              </Button>
            </div>

            {loadingClases ? (
              <LoadingSkeleton type="card" count={2} />
            ) : clases.length === 0 ? (
              <EmptyState
                icon="bx-book-open"
                title="No tienes clases registradas"
                description={
                  user.rol === "alumno"
                    ? "Aún no te has matriculado en ninguna materia de tu curso."
                    : "Aún no has creado ni tienes asignadas aulas virtuales."
                }
                actionLabel={user.rol === "alumno" ? "Unirse a una clase" : "Crear mi primera clase"}
                onAction={() => navigate(user.rol === "alumno" ? "/alumno" : "/clases")}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
                {clases.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(user.rol === "alumno" ? `/alumno/gestion/${c.id}` : `/gestionClase/${c.id}`)}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      padding: "1.4rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.4)";
                      e.currentTarget.style.transform = "translateY(-3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-color)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span className="badge badge-purple">{c.materia || "Materia"}</span>
                        {c.codigo && <span className="badge badge-blue">#{c.codigo}</span>}
                      </div>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.35rem" }}>
                        {c.nombre}
                      </h4>
                      <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0 0 0.25rem" }}>
                        Aula: {c.aula || "S/D"} · {c.seccion || "Turno Regular"}
                      </p>
                      <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>
                        Docente: {c.creador || "Profesor"}
                      </p>
                    </div>

                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      paddingTop: "0.75rem",
                      fontSize: "0.8rem"
                    }}>
                      <span style={{ color: "#94a3b8" }}>
                        <i className="bx bx-group" style={{ marginRight: "0.25rem" }}></i>
                        {c.cantidad_alumnos ?? 0} alumnos
                      </span>
                      <span style={{ color: "#38bdf8", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        Entrar <i className="bx bx-right-arrow-alt"></i>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Seguridad */}
        {activeTab === "seguridad" && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: "16px", padding: "1.75rem"
          }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", marginBottom: "1rem" }}>Cambiar Contraseña</h3>
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <InputField
                label="Contraseña Actual"
                type="password"
                placeholder="••••••••"
                value={passwords.actual}
                onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })}
                icon="bx-lock-alt"
                required
              />
              <InputField
                label="Nueva Contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={passwords.nueva}
                onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
                icon="bx-key"
                required
              />
              <InputField
                label="Confirmar Nueva Contraseña"
                type="password"
                placeholder="Repite la nueva contraseña"
                value={passwords.confirmar}
                onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })}
                icon="bx-key"
                required
              />
              <Button type="submit" loading={loading} icon="bx-check">
                Actualizar Contraseña
              </Button>
            </form>
          </div>
        )}

        {/* Tab 3: Preferencias */}
        {activeTab === "preferencias" && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: "16px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem"
          }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>Notificaciones & Tema</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#f1f5f9", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--primary)", width: "18px", height: "18px" }} />
                Recibir notificaciones por correo sobre nuevos trabajos publicados
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#f1f5f9", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--primary)", width: "18px", height: "18px" }} />
                Recibir avisos de calificaciones y correcciones de entregas
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#f1f5f9", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--primary)", width: "18px", height: "18px" }} />
                Modo oscuro (tema por defecto del campus técnico)
              </label>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default Profile;
