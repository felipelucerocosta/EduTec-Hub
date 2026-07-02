import React, { useState, useEffect } from "react";
import styles from "../styles.module.css";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import Modal from "../components reutilizables/Modal";

interface Clase {
  id?: number;
  materia: string;
  nombre: string;
  seccion: string;
  aula: string;
  creador: string;
  codigo?: string;
}

const ClasesAlumno: React.FC = () => {
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [clases, setClases] = useState<Clase[]>([]);
  const [mensajeError, setMensajeError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "" }>({ msg: "", type: "" });
  const navigate = useNavigate();

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const cargarClases = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/alumno/mis-clases", {
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
    cargarClases();
  }, []);

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
      const response = await fetch("http://localhost:3001/api/unirse-clase", {
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

  return (
    <div className={styles.pageWrapper}>
      <Header navLinks={[]} />

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
            <div className={styles.emptyState} style={{ gridColumn: "1 / -1" }}>
              <i className={`bx bx-folder-open ${styles.emptyStateIcon}`}></i>
              <p className={styles.emptyStateText}>No estás inscrito en ninguna clase todavía.</p>
              <Button variant="outline" onClick={() => setMostrarUnirse(true)} style={{ marginTop: "1rem" }} icon="bx-plus">
                Inscribirse ahora
              </Button>
            </div>
          ) : (
            clases.map((clase, index) => (
              <div key={index} className={styles.claseItem} onClick={() => navigate(`/alumno/gestion/${(clase as any).id ?? index}`)}>
                <h3>{clase.nombre}</h3>
                <p style={{ marginTop: "0.4rem" }}><strong>Materia:</strong> {clase.materia}</p>
                <p><strong>Aula:</strong> {clase.aula} | {clase.seccion}</p>
                <p><strong>Docente:</strong> {clase.creador}</p>
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
  );
};

export default ClasesAlumno;