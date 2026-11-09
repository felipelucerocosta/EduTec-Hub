import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles.module.css";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components reutilizables/Button";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { BACKEND_URL } from "../config/api";

interface Clase {
  materia: string;
  nombre: string;
  seccion: string;
  aula: string;
  creador: string;
  id?: number;
  codigo?: string;
  titular_id?: number;
  cantidad_alumnos?: number;
  total_trabajos?: number;
}

const Clases: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = user?.rol === 'admin' ? '/api/admin/clases' : '/api/profesor/mis-clases';
      const res = await fetch(`${BACKEND_URL}${endpoint}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setClases(Array.isArray(data) ? data : []);
      } else {
        showToast("Error al cargar las clases.", "error");
      }
    } catch (err) {
      console.error("Error al cargar clases de profesor:", err);
      showToast("Error de conexión con el servidor.", "error");
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return (
    <AppLayout>
      <div className={styles.dashboard}>
        <main className={styles.main}>
          {/* Header Banner */}
          <div className={styles.headerBanner}>
            <div>
              <div className={styles.headerSubtitle}>
                <i className="bx bx-chalkboard"></i> {user?.rol === 'admin' ? 'Gestión Institucional de Aulas' : 'Panel Docente'}
              </div>
              <h1 className={styles.headerTitle}>Mis Clases</h1>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: "0.25rem 0 0 0" }}>
                {user?.rol === 'admin'
                  ? 'Aulas y comisiones activas en la institución.'
                  : 'Cursos y materias donde te encuentras asignado como docente.'}
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {user?.rol === 'admin' && (
                <Button onClick={() => navigate('/admin/clases')} icon="bx-plus">
                  Crear Clase
                </Button>
              )}
              <Button variant="outline" onClick={() => fetchClasses()} icon="bx-refresh">
                Actualizar
              </Button>
            </div>
          </div>

          {/* Classes Grid */}
          <div className={styles.coursesList}>
            {loading ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <LoadingSkeleton type="card" count={3} />
              </div>
            ) : clases.length === 0 ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <EmptyState
                  icon="bx-book-bookmark"
                  title="No tenés clases asignadas actualmente"
                  description="Cuando la institución te asigne como docente a un curso o comisión, aparecerá acá."
                  actionLabel={user?.rol === 'admin' ? 'Ir al Panel de Clases' : undefined}
                  onAction={user?.rol === 'admin' ? () => navigate('/admin/clases') : undefined}
                />
              </div>
            ) : (
              clases.map((clase, index) => (
                <div
                  key={clase.id || index}
                  className={styles.claseItem}
                  style={{ cursor: "pointer" }}
                  onClick={() => clase.id && navigate(`/gestionClase/${clase.id}`)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="badge badge-purple">{clase.materia}</span>
                    {clase.codigo && <span className={styles.claseBadge}>#{clase.codigo}</span>}
                  </div>
                  <h3>{clase.nombre}</h3>
                  <p style={{ marginTop: "0.4rem" }}>
                    <strong>División:</strong> {clase.seccion || "Única"} {clase.aula ? `| Aula: ${clase.aula}` : ""}
                  </p>
                  <p><strong>Docente:</strong> {clase.creador || "Docente Asignado"}</p>
                  <p><strong>Alumnos inscriptos:</strong> {clase.cantidad_alumnos ?? 0}</p>

                  <div className={styles.claseMeta} style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {clase.total_trabajos !== undefined ? `${clase.total_trabajos} trabajos` : ''}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#38bdf8", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem", marginLeft: "auto" }}>
                      Gestionar Aula <i className="bx bx-right-arrow-alt" style={{ fontSize: "1.1rem" }}></i>
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

export default Clases;
