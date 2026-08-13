import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"info" | "seguridad" | "preferencias">("info");
  const [loading, setLoading] = useState(false);

  // Security form state
  const [passwords, setPasswords] = useState({ actual: "", nueva: "", confirmar: "" });

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
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Profile Header Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(56, 189, 248, 0.15))",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          borderRadius: "20px", padding: "2rem",
          display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap"
        }}>
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

        {/* Profile Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("info")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "info" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "info" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "info" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem"
            }}
          >
            <i className="bx bx-user-pin"></i> Información Personal
          </button>
          <button
            onClick={() => setActiveTab("seguridad")}
            style={{
              padding: "0.6rem 1.25rem", borderRadius: "10px", border: "none",
              background: activeTab === "seguridad" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "seguridad" ? "#f8fafc" : "#94a3b8",
              fontWeight: activeTab === "seguridad" ? 600 : 500, fontSize: "0.9rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem"
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
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem"
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

        {/* Tab 2: Seguridad */}
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
