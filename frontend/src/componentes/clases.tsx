import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles.module.css";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import Modal from "../components reutilizables/Modal";

interface Clase {
  materia: string;
  nombre: string;
  seccion: string;
  aula: string;
  creador: string;
  id?: number;
  codigo?: string;
  titular_id?: number;
}

const STORAGE_KEY = "mis_clases";

const Clases: React.FC = () => {
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [clases, setClases] = useState<Clase[]>([]);
  const navigate = useNavigate();
  const [pendingModal, setPendingModal] = useState<{ open: boolean; claseId?: number; solicitudes: any[] }>({
    open: false,
    solicitudes: [],
  });
  const [currentUser, setCurrentUser] = useState<{ id?: number; rol?: string; nombre?: string } | null>(null);
  const [accessMap, setAccessMap] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "" }>({ msg: "", type: "" });

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setClases(JSON.parse(saved));
      } catch {
        console.error("Error al leer localStorage");
      }
    }
    
    (async () => {
      try {
        const r = await fetch("http://localhost:3001/api/whoami", { credentials: "include" });
        const d = await r.json();
        setCurrentUser(d.user || null);
        if (d.user && (d.user.rol === "profesor" || d.user.rol === "admin")) {
          await fetchServerClasses(d.user);
        }
      } catch (err) {
        console.error("No se pudo obtener whoami:", err);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clases));
  }, [clases]);

  const fetchServerClasses = async (user = currentUser) => {
    try {
      const res = await fetch("http://localhost:3001/api/clases", { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          materia: r.materia,
          nombre: r.nombre,
          seccion: r.seccion,
          aula: r.aula,
          creador: r.creador,
          codigo: r.codigo,
          titular_id: r.titular_id,
        }));
        setClases(mapped);
        
        if (user?.rol === "profesor") {
          const ids = mapped.map((m) => m.id).filter(Boolean) as number[];
          if (ids.length > 0) {
            try {
              const r2 = await fetch("http://localhost:3001/api/campus/has-access-batch", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clase_ids: ids }),
              });
              const d2 = await r2.json();
              if (r2.ok && d2.access) {
                const newMap: Record<number, boolean> = {};
                Object.keys(d2.access).forEach((k) => {
                  newMap[Number(k)] = !!d2.access[k];
                });
                setAccessMap(newMap);
              }
            } catch (err) {
              console.error("Error fetching batch access:", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error al cargar clases del servidor", err);
      showToast("Error al cargar clases del servidor.", "error");
    }
  };

  const checkAccessForClass = async (claseId?: number) => {
    if (!claseId || !currentUser) return;
    try {
      const r = await fetch("http://localhost:3001/api/campus/has-access-batch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clase_ids: [claseId] }),
      });
      const d = await r.json();
      if (r.ok && d.access) {
        setAccessMap((prev) => ({ ...prev, [claseId]: !!d.access[claseId] }));
      }
    } catch (err) {
      console.error("Error checking access for class", err);
    }
  };

  const solicitarAcceso = async (claseId?: number) => {
    if (!claseId) {
      showToast("Esta clase no tiene id válido.", "error");
      return;
    }
    try {
      const res = await fetch("http://localhost:3001/api/campus/solicitar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clase_id: claseId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Solicitud de acceso enviada correctamente.", "success");
      } else {
        showToast(data.error || "No se pudo solicitar acceso.", "error");
      }
    } catch (err) {
      console.error("Error solicitar acceso", err);
      showToast("Error al solicitar acceso.", "error");
    }
  };

  const abrirSolicitudes = async (claseId?: number) => {
    if (!claseId) {
      showToast("ID de clase no disponible.", "error");
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/api/campus/solicitudes/${claseId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setPendingModal({ open: true, claseId, solicitudes: data.solicitudes || [] });
      } else {
        showToast(data.error || "No se pudieron obtener solicitudes.", "error");
      }
    } catch (err) {
      console.error("Error al obtener solicitudes", err);
      showToast("Error al obtener solicitudes.", "error");
    }
  };

  const aprobarSolicitud = async (solicitudId: number) => {
    try {
      const res = await fetch("http://localhost:3001/api/campus/aprobar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitud_id: solicitudId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Solicitud aprobada con éxito.", "success");
        if (pendingModal.claseId) {
          abrirSolicitudes(pendingModal.claseId);
          await fetchServerClasses();
        }
      } else {
        showToast(data.error || "Error al aprobar solicitud.", "error");
      }
    } catch (err) {
      console.error("Error aprobar solicitud", err);
      showToast("Error al aprobar solicitud.", "error");
    }
  };

  const handleCrearClase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nuevaClase: Clase = {
      materia: formData.get("materia") as string,
      nombre: formData.get("nombre") as string,
      seccion: formData.get("seccion") as string,
      aula: formData.get("aula") as string,
      creador: formData.get("creador") as string,
    };
    
    if (!nuevaClase.materia || !nuevaClase.nombre) {
      showToast("Completa los campos obligatorios.", "error");
      return;
    }

    const existe = clases.some(
      (c) => c.materia === nuevaClase.materia && c.nombre === nuevaClase.nombre && c.seccion === nuevaClase.seccion
    );
    if (existe) {
      showToast("Ya existe una clase local con los mismos datos.", "error");
      return;
    }

    (async () => {
      try {
        const res = await fetch("http://localhost:3001/api/crear-clase", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nuevaClase),
        });
        const data = await res.json();
        if (res.status === 201 || data.success) {
          showToast("¡Clase creada exitosamente!", "success");
          await fetchServerClasses();
          setMostrarCrear(false);
        } else if (res.status === 409) {
          showToast("La clase ya existe en el servidor.", "error");
        } else {
          showToast(data.error || "Error al crear la clase.", "error");
        }
      } catch (err) {
        console.error("Error enviando crear-clase:", err);
        showToast("Error al conectar con el servidor.", "error");
      }
    })();
  };

  const handleUnirseClase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const materia = formData.get("materia") as string;
    const codigo = formData.get("codigo") as string;
    console.log("Unido a clase:", { materia, codigo });
    showToast("Unido exitosamente a la clase.", "success");
    setMostrarUnirse(false);
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
            <h1 className={styles.pageTitle}>Panel de Clases</h1>
            <p className={styles.pageSubtitle}>
              {currentUser ? `Bienvenido, ${currentUser.nombre}. Gestiona tus clases y alumnos.` : "Cargando usuario..."}
            </p>
          </div>
          <div className={styles.actionBar}>
            {(currentUser?.rol === "admin" || currentUser?.rol === "profesor") && (
              <Button onClick={() => { setMostrarCrear(true); setMostrarUnirse(false); }} icon="bx-plus">
                Crear Clase
              </Button>
            )}
            <Button variant="secondary" onClick={() => { setMostrarUnirse(true); setMostrarCrear(false); }} icon="bx-key">
              Unirse con Código
            </Button>
            <Button variant="outline" onClick={() => fetchServerClasses()} icon="bx-refresh">
              Sincronizar
            </Button>
          </div>
        </div>

        {/* Form Modals */}
        <Modal isOpen={mostrarCrear} onClose={() => setMostrarCrear(false)} title="Crear Nueva Clase">
          <form onSubmit={handleCrearClase} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <InputField label="Materia" name="materia" placeholder="Ej: Programación" icon="bx-book" required />
            <InputField label="Nombre de la Clase" name="nombre" placeholder="Ej: 5to 2da - Computación" icon="bx-pencil" required />
            <InputField label="Sección" name="seccion" placeholder="Ej: Turno Tarde" icon="bx-time-five" required />
            <InputField label="Aula" name="aula" placeholder="Ej: Laboratorio 3" icon="bx-door-open" required />
            <InputField label="Profesor a cargo" name="creador" defaultValue={currentUser?.nombre || ""} placeholder="Nombre del docente" icon="bx-user" required />
            <Button type="submit" style={{ width: "100%", marginTop: "0.5rem" }}>
              Crear Clase
            </Button>
          </form>
        </Modal>

        <Modal isOpen={mostrarUnirse} onClose={() => setMostrarUnirse(false)} title="Unirse a Clase">
          <form onSubmit={handleUnirseClase} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <InputField label="Materia" name="materia" placeholder="Ej: Programación" icon="bx-book" required />
            <InputField label="Código de Acceso" name="codigo" placeholder="Ej: PRG567" icon="bx-key" required />
            <Button type="submit" style={{ width: "100%", marginTop: "0.5rem" }}>
              Unirse
            </Button>
          </form>
        </Modal>

        {/* Classes Grid */}
        <div className={styles.coursesList}>
          {clases.length === 0 ? (
            <div className={styles.emptyState} style={{ gridColumn: "1 / -1" }}>
              <i className={`bx bx-folder-open ${styles.emptyStateIcon}`}></i>
              <p className={styles.emptyStateText}>No tienes clases asignadas. Comienza creando una clase o sincronizando.</p>
            </div>
          ) : (
            clases.map((clase, index) => (
              <div
                key={index}
                className={styles.claseItem}
                style={{ cursor: "pointer" }}
                onClick={() => clase.id && navigate(`/gestionClase/${clase.id}`)}
              >
                <h3>{clase.nombre}</h3>
                <p style={{ marginTop: "0.4rem" }}><strong>Materia:</strong> {clase.materia}</p>
                <p><strong>Aula:</strong> {clase.aula} | {clase.seccion}</p>
                <p><strong>Docente:</strong> {clase.creador}</p>

                <div className={styles.claseMeta} style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {clase.codigo && <span className={styles.claseBadge}>Código: {clase.codigo}</span>}
                  <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem", marginLeft: "auto" }}>
                    Entrar <i className="bx bx-right-arrow-alt" style={{ fontSize: "1.1rem" }}></i>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Solicitude Approval Modal */}
      <Modal
        isOpen={pendingModal.open}
        onClose={() => setPendingModal({ open: false, solicitudes: [] })}
        title={`Solicitudes de Acceso - Clase #${pendingModal.claseId}`}
      >
        {pendingModal.solicitudes.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "0.9rem", textAlign: "center", padding: "1.5rem 0" }}>
            No hay solicitudes pendientes para esta clase.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {pendingModal.solicitudes.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#f1f5f9" }}>
                    ID Profesor: {s.profesor_id}
                  </span>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: s.estado === "pendiente" ? "#fbbf24" : "#34d399",
                    background: s.estado === "pendiente" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "50px"
                  }}>
                    {s.estado}
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Fecha: {new Date(s.solicitado_at).toLocaleDateString()} {new Date(s.solicitado_at).toLocaleTimeString()}
                </span>
                {s.estado === "pendiente" && (
                  <Button
                    variant="primary"
                    onClick={() => aprobarSolicitud(s.id)}
                    icon="bx-check"
                    style={{ alignSelf: "flex-end", padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                  >
                    Aprobar Acceso
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Clases;
