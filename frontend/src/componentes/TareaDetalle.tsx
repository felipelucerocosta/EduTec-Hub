import React, { useState, useRef } from "react";
import Button from "../components reutilizables/Button";

interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  instrucciones?: string;
  fecha_limite?: string;
  fechaEntrega?: string;
  puntos_max?: number;
  porcentaje?: number;
  mi_entrega?: {
    id: number;
    archivo_nombre?: string;
    comentario?: string;
    estado: string;
    calificacion?: number;
    feedback?: string;
    fecha_entrega?: string;
  } | null;
}

interface Props {
  tarea: Tarea;
  onClose: () => void;
  onSubmitted?: () => void;
}

const TareaDetalle: React.FC<Props> = ({ tarea, onClose, onSubmitted }) => {
  const archivoRef = useRef<HTMLInputElement>(null);
  const [comentario, setComentario] = useState(tarea.mi_entrega?.comentario || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" | "" }>({ msg: "", type: "" });
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const entrega = tarea.mi_entrega;
  const isEntregado = Boolean(entrega && entrega.estado !== "retirado");

  const showNotify = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubirEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("archivo", selectedFile);
      }
      formData.append("comentario", comentario);

      const res = await fetch(`http://localhost:3001/api/trabajos/${tarea.id}/entregar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        showNotify(data.message || "¡Trabajo entregado correctamente!", "success");
        if (onSubmitted) onSubmitted();
        setTimeout(onClose, 1200);
      } else {
        throw new Error(data.error || "Error al entregar trabajo");
      }
    } catch (err: any) {
      showNotify(err.message || "No se pudo subir la entrega", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRetirarEntrega = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/trabajos/${tarea.id}/retirar`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        showNotify("Entrega retirada exitosamente.", "success");
        if (onSubmitted) onSubmitted();
        setTimeout(onClose, 1200);
      } else {
        throw new Error(data.error || "Error al retirar la entrega");
      }
    } catch (err: any) {
      showNotify(err.message || "No se pudo retirar la entrega", "error");
    } finally {
      setLoading(false);
    }
  };

  const fechaLimiteFormatted = tarea.fecha_limite
    ? new Date(tarea.fecha_limite).toLocaleDateString("es-ES", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : tarea.fechaEntrega || "Sin fecha límite";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(9, 13, 22, 0.8)", backdropFilter: "blur(8px)",
      zIndex: 2500, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem"
    }} onClick={onClose}>
      <div style={{
        background: "#0f172a", border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "20px", maxWidth: "620px", width: "100%", padding: "2rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", color: "#f8fafc",
        maxHeight: "90vh", overflowY: "auto"
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <span className={`badge ${
              isEntregado ? (entrega?.estado === "corregido" ? "badge-green" : "badge-purple") : "badge-amber"
            }`} style={{ marginBottom: "0.5rem" }}>
              {isEntregado ? (entrega?.estado === "corregido" ? "Corregido" : "Entregado") : "Pendiente"}
            </span>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.25rem 0 0" }}>{tarea.titulo}</h2>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#64748b", fontSize: "1.5rem", cursor: "pointer"
          }}>
            <i className="bx bx-x"></i>
          </button>
        </div>

        {notification.msg && (
          <div style={{
            padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.88rem",
            background: notification.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
            color: notification.type === "success" ? "#34d399" : "#fb7185",
            border: notification.type === "success" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(244, 63, 94, 0.3)"
          }}>
            {notification.msg}
          </div>
        )}

        {/* Task Details */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 0.5rem", color: "#cbd5e1", fontSize: "0.92rem", lineHeight: 1.6 }}>
            {tarea.descripcion || tarea.instrucciones || "Sin descripción adicional."}
          </p>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.82rem", color: "#94a3b8", flexWrap: "wrap", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span><i className="bx bx-calendar" style={{ marginRight: "0.25rem" }}></i> <strong>Fecha límite:</strong> {fechaLimiteFormatted}</span>
            <span><i className="bx bx-trophy" style={{ marginRight: "0.25rem" }}></i> <strong>Puntos:</strong> {tarea.puntos_max || 100} pts</span>
          </div>
        </div>

        {/* Teacher Feedback section if graded */}
        {entrega && entrega.calificacion !== undefined && (
          <div style={{
            background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "14px", padding: "1.25rem", marginBottom: "1.5rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700, color: "#34d399", fontSize: "0.9rem" }}>Calificación del Profesor</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#34d399" }}>{entrega.calificacion} / 100</span>
            </div>
            {entrega.feedback && (
              <p style={{ margin: 0, color: "#e2e8f0", fontSize: "0.88rem", fontStyle: "italic" }}>
                "{entrega.feedback}"
              </p>
            )}
          </div>
        )}

        {/* Submission Status or Upload Form */}
        {isEntregado && entrega ? (
          <div style={{ background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.2)", borderRadius: "14px", padding: "1.25rem" }}>
            <h4 style={{ margin: "0 0 0.5rem", color: "#a78bfa", fontSize: "0.95rem" }}>Tu Entrega</h4>
            {entrega.archivo_nombre && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", background: "rgba(255,255,255,0.04)", padding: "0.6rem 0.85rem", borderRadius: "8px" }}>
                <i className="bx bx-file" style={{ fontSize: "1.4rem", color: "#38bdf8" }}></i>
                <span style={{ fontSize: "0.88rem", color: "#f1f5f9", fontWeight: 500 }}>{entrega.archivo_nombre}</span>
              </div>
            )}
            {entrega.comentario && (
              <p style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: "0 0 1rem" }}>
                <strong>Comentario:</strong> {entrega.comentario}
              </p>
            )}

            {!confirmWithdraw ? (
              <Button variant="outline" onClick={() => setConfirmWithdraw(true)} icon="bx-undo" disabled={loading} style={{ width: "100%" }}>
                Retirar Entrega
              </Button>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.85rem", color: "#fb7185", marginBottom: "0.75rem" }}>¿Seguro que deseas retirar esta entrega?</p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button variant="danger" onClick={handleRetirarEntrega} loading={loading} style={{ flex: 1 }}>
                    Sí, Retirar
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirmWithdraw(false)} style={{ flex: 1 }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubirEntrega} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#f1f5f9" }}>Entregar Trabajo</h4>
            
            {/* File Dropzone */}
            <div
              onClick={() => archivoRef.current?.click()}
              style={{
                border: "2px dashed rgba(124, 58, 237, 0.4)",
                borderRadius: "14px", padding: "1.5rem", textAlign: "center",
                cursor: "pointer", background: "rgba(124, 58, 237, 0.05)",
                transition: "background 0.2s"
              }}
            >
              <input type="file" ref={archivoRef} onChange={handleFileChange} style={{ display: "none" }} />
              <i className="bx bx-cloud-upload" style={{ fontSize: "2.2rem", color: "#a78bfa", marginBottom: "0.5rem" }}></i>
              {selectedFile ? (
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "#38bdf8", fontSize: "0.9rem" }}>{selectedFile.name}</p>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem" }}>Hacé clic para seleccionar archivo</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>Soporta PDF, ZIP, DOCX, imágenes (Máx 25MB)</p>
                </div>
              )}
            </div>

            <textarea
              placeholder="Agregar un comentario para el profesor (opcional)..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              style={{
                background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px", padding: "0.75rem 1rem", color: "#f8fafc", fontSize: "0.88rem",
                resize: "vertical"
              }}
            />

            <Button type="submit" loading={loading} icon="bx-send" style={{ width: "100%" }}>
              Entregar Trabajo
            </Button>
          </form>
        )}

      </div>
    </div>
  );
};

export default TareaDetalle;
