import React, { useState, useEffect } from "react";
import styles from "../styles.module.css";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import Modal from "../components reutilizables/Modal";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config/api";

interface Clase {
  id?: number;
  materia: string;
  nombre: string;
  seccion: string;
  aula: string;
  creador: string;
  codigo?: string;
  cantidad_alumnos?: number;
}

const ClasesAlumno: React.FC = () => {
  const { user } = useAuth();
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [clases, setClases] = useState<Clase[]>([]);
  const [mensajeError, setMensajeError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "" }>({ msg: "", type: "" });
  const navigate = useNavigate();

  // Check if student is pending or suspended
  const esPendiente = user?.rol === 'alumno' && user?.estado_acceso !== 'ACTIVO';
  const isSuspendido = user?.estado_acceso === 'SUSPENDIDO';

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const cargarClases = async () => {
    try {
      const response = await fetch(`${API_URL}/alumno/mis-clases`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setClases(data);
      }
    } catch (error) {
      console.error("Error cargando clases:", error);
    }
  };

  useEffect(() => {
    if (!esPendiente) {
      cargarClases();
    }
  }, [esPendiente]);

  const handleUnirseClase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensajeError("");
    const formData = new FormData(e.currentTarget);
    const materia = formData.get("materia") as string;
    const codigo = formData.get("codigo") as string;

    if (!materia || !codigo) {
      setMensajeError("Por favor, completa todos los campos.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/unirse-clase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materia, codigo }),
        credentials: "include",
      });

      const resultado = await response.text();

      if (response.ok) {
        await cargarClases();
        setMostrarUnirse(false);
        (e.target as HTMLFormElement).reset();
        showToast("¡Te has unido a la clase con éxito!", "success");
      } else {
        setMensajeError(resultado);
      }
    } catch (error) {
      console.error("Error al unirse:", error);
      setMensajeError("Error de conexión con el servidor.");
    }
  };

  // ── Pantalla para alumnos PENDIENTES o SUSPENDIDOS ───────────────────────────────────────
  if (esPendiente) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '2rem', textAlign: 'center' }}>
          {/* Animated illustration */}
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: isSuspendido
              ? 'linear-gradient(135deg, rgba(244,63,94,0.2), rgba(244,63,94,0.08))'
              : 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(56,189,248,0.1))',
            border: isSuspendido ? '2px solid rgba(244,63,94,0.35)' : '2px solid rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '2rem',
            animation: 'pulse 2.5s ease-in-out infinite',
            boxShadow: isSuspendido ? '0 0 40px rgba(244,63,94,0.15)' : '0 0 40px rgba(124,58,237,0.15)'
          }}>
            <i className={`bx ${isSuspendido ? 'bx-block' : 'bx-time-five'}`} style={{ fontSize: '3rem', color: isSuspendido ? '#fb7185' : '#a78bfa' }}></i>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${isSuspendido ? 'rgba(244,63,94,0.25)' : 'rgba(124,58,237,0.25)'}`,
            borderRadius: '20px',
            padding: '2.5rem 3rem',
            maxWidth: '560px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: isSuspendido ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)',
              border: isSuspendido ? '1px solid rgba(244,63,94,0.25)' : '1px solid rgba(245,158,11,0.25)',
              color: isSuspendido ? '#fb7185' : '#fbbf24',
              borderRadius: '999px', padding: '0.35rem 1rem',
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em',
              marginBottom: '1.25rem', textTransform: 'uppercase'
            }}>
              {isSuspendido
                ? <><i className="bx bx-block"></i> Cuenta suspendida</>
                : <><i className="bx bx-loader-alt bx-spin"></i> Pendiente de asignación</>}
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 1rem 0', lineHeight: 1.3 }}>
              {isSuspendido ? 'Tu acceso ha sido suspendido' : 'Aún no tienes clases asignadas'}
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              {isSuspendido
                ? 'Tu cuenta fue suspendida por el administrador. Por favor, contactate con la institución para más información.'
                : 'Aún no tienes clases asignadas a tu perfil. Cuando el Administrador te asigne un curso o comisión, aparecerán automáticamente en tu panel.'}
            </p>

            <div style={{
              marginTop: '2rem', padding: '1rem 1.25rem',
              background: isSuspendido ? 'rgba(244,63,94,0.07)' : 'rgba(56,189,248,0.07)',
              border: isSuspendido ? '1px solid rgba(244,63,94,0.15)' : '1px solid rgba(56,189,248,0.15)',
              borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
            }}>
              <i className="bx bx-info-circle" style={{ color: isSuspendido ? '#fb7185' : '#38bdf8', fontSize: '1.2rem', marginTop: '2px', flexShrink: 0 }}></i>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
                {isSuspendido
                  ? 'Si crees que esto es un error, comunícate con tu preceptor o con el administrador del sistema.'
                  : 'Tu cuenta está registrada y verificada. El acceso al contenido académico se habilitará automáticamente una vez que el administrador complete tu asignación.'}
              </p>
            </div>
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.05);opacity:0.85} }`}</style>
      </AppLayout>
    );
  }

  // ── Vista normal para alumnos ACTIVOS ─────────────────────────────────────
  return (
    <AppLayout>
      <div className={styles.pageWrapper} style={{ minHeight: 'auto', background: 'transparent', padding: 0 }}>

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

      <main className={styles.mainLayout}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className={styles.pageTitle}>Mis Clases</h1>
            <p className={styles.pageSubtitle}>Accede a tus materias asignadas y realiza tus actividades.</p>
          </div>
          <div className={styles.actionBar}>
            <Button onClick={() => setMostrarUnirse(true)} icon="bx-key">
              Unirse a una Clase
            </Button>
          </div>
        </div>

        <Modal isOpen={mostrarUnirse} onClose={() => { setMostrarUnirse(false); setMensajeError(""); }} title="Unirse a una Clase">
          <form onSubmit={handleUnirseClase} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "0.5rem" }}>
              Ingresa el nombre de la materia y el código provisto por tu docente para matricularte.
            </p>
            {mensajeError && (
              <div style={{ color: "#fb7185", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", padding: "0.6rem 1rem", borderRadius: "8px", fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <i className="bx bx-error-circle"></i>
                {mensajeError}
              </div>
            )}
            <InputField label="Materia" name="materia" placeholder="Ej: Historia" icon="bx-book" required />
            <InputField label="Código de Clase" name="codigo" placeholder="Ej: HIS1234" icon="bx-key" required />
            <Button type="submit" style={{ width: "100%", marginTop: "0.5rem" }}>
              Unirse
            </Button>
          </form>
        </Modal>

        {/* Classes grid */}
        <div className={styles.coursesList}>
          {clases.length === 0 ? (
            <div className={styles.emptyState} style={{ gridColumn: "1 / -1", padding: "3rem 1.5rem" }}>
              <i className={`bx bx-folder-open ${styles.emptyStateIcon}`}></i>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", margin: "0.75rem 0 0.25rem 0" }}>
                No tenés clases asignadas actualmente.
              </h3>
              <p className={styles.emptyStateText} style={{ maxWidth: "500px", margin: "0.25rem auto 1.5rem auto" }}>
                Cuando un administrador te asigne a una clase, aparecerá acá.
              </p>
              <Button variant="outline" onClick={() => setMostrarUnirse(true)} icon="bx-key">
                Unirse con Código
              </Button>
            </div>
          ) : (
            clases.map((clase, index) => (
              <div key={index} className={styles.claseItem} onClick={() => navigate(`/alumno/gestion/${(clase as any).id ?? index}`)}>
                <h3>{clase.nombre}</h3>
                <p style={{ marginTop: "0.4rem" }}><strong>Materia:</strong> {clase.materia}</p>
                <p><strong>Aula:</strong> {clase.aula} | {clase.seccion}</p>
                <p><strong>Docente:</strong> {clase.creador}</p>
                <p><strong>Alumnos inscriptos:</strong> {clase.cantidad_alumnos ?? 0}</p>
                <div className={styles.claseMeta} style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    Ir a Clase <i className="bx bx-right-arrow-alt" style={{ fontSize: "1.1rem" }}></i>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
    </AppLayout>
  );
};

export default ClasesAlumno;