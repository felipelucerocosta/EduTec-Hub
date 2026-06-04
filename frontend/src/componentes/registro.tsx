import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import Modal from "../components reutilizables/Modal";
import styles from "../Registro.module.css";

// --- Interfaces ---
interface Notification {
  msg: string;
  type: "success" | "error" | "";
}

interface FormData {
  nombre_completo: string;
  DNI: string;
  correo: string;
  contrasena: string;
  curso: string;    // Para alumnos
  materia: string;  // Para profesores
}

// --- Constantes ---
const ALUMNO_DOMAIN = "@alu.tecnica29de6.edu.ar";
const PROFESOR_DOMAIN = "@tecnica29de6.edu.ar";
const API_URL = "http://localhost:3001/api"; 

const Registro: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState<boolean>(false); 
  const [notification, setNotification] = useState<Notification>({ msg: "", type: "" });
  const [formData, setFormData] = useState<FormData>({
    nombre_completo: "",
    DNI: "",
    correo: "",
    contrasena: "",
    curso: "",
    materia: "",
  });
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminForm, setAdminForm] = useState({ correo: "", contrasena: "" });
  const [adminError, setAdminError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nivel = searchParams.get("nivel"); // Obtener el nivel seleccionado

  // --- Funciones Auxiliares ---
  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    const { correo, contrasena } = adminForm;
    if (!correo || !contrasena) {
      setAdminError("Completa el correo y la contraseña del admin.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAdminError(data.message || "Credenciales de admin incorrectas.");
        return;
      }

      navigate("/admin");
    } catch (error: any) {
      setAdminError(error.message || "Error de conexión con el servidor.");
    }
  };

  // --- Lógica de Pestañas ---
  const handleTabChange = (registering: boolean) => {
    setIsRegistering(registering);
    setNotification({ msg: "", type: "" }); // Limpia notificaciones al cambiar
  };

  // --- Lógica de API: Iniciar Sesión ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { correo, contrasena } = formData;
    
    if (!correo.endsWith(ALUMNO_DOMAIN) && !correo.endsWith(PROFESOR_DOMAIN)) {
      showNotification("Por favor, use un correo institucional para iniciar sesión.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });
      
      const data = await response.json(); 

      if (response.ok) {
        showNotification(data.message, "success");

        if (data.usuario && data.usuario.rol === "profesor") {
          navigate("/clases");
        } else if (data.usuario && data.usuario.rol === "alumno") {
          navigate("/alumno");
        } else {
          showNotification("Rol de usuario desconocido.", "error");
        }
      } else {
        throw new Error(data.message || "Error al iniciar sesión");
      }
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Lógica de API: Registrarse ---
  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    const { correo } = formData;
    
    const isProfesor = correo.endsWith(PROFESOR_DOMAIN);
    const isAlumno = correo.endsWith(ALUMNO_DOMAIN);

    if (!isProfesor && !isAlumno) {
      showNotification("Debe usar un correo institucional de profesor o alumno.", "error");
      return;
    }

    const endpoint = isProfesor ? `${API_URL}/registro-profesor` : `${API_URL}/registro-alumno`;
    
    const body = {
      nombre_completo: formData.nombre_completo,
      correo: formData.correo,
      DNI: formData.DNI,
      contrasena: formData.contrasena,
      ...(isAlumno && { curso: formData.curso }),
      ...(isProfesor && { materia: formData.materia }),
    };

    setIsLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.text(); 

      if (response.ok) {
        showNotification(data, "success"); // "Registro exitoso..."
        setIsRegistering(false); // Vuelve a la pestaña de Login
        setFormData(prev => ({ 
            ...prev, 
            nombre_completo: "", 
            DNI: "", 
            curso: "", 
            materia: "" 
        }));
      } else {
        throw new Error(data); // "El correo o DNI ya está registrado."
      }
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Nivel amigable para mostrar en UI
  const getFriendlyNivel = () => {
    if (nivel === "basico") return "Ciclo Básico (1° a 3° Año)";
    if (nivel === "superior") return "Ciclo Superior (4° a 6° Año)";
    if (nivel === "profesional") return "Formación Profesional";
    return null;
  };

  return (
    <div className={styles.loginRegisterBody}>
      {/* Header unificado sin links de navegación adicionales */}
      <Header showLogout={false} />
      
      {notification.msg && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.msg}
        </div>
      )}
      
      <div className={styles.loginRegisterContainer}>
        <div className={styles.containerPrincipal}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <Link to="/" style={{ color: "#3b82f6", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem", fontWeight: 600 }}>
              <i className="bx bx-arrow-back"></i> Volver a Niveles
            </Link>
            <button
              type="button"
              className={styles.adminToggle}
              onClick={() => setShowAdminModal(true)}
            >
              🛡 admin
            </button>
          </div>
          
          <form onSubmit={isRegistering ? handleRegistro : handleLogin}>
            <h2 style={{ color: "black", marginBottom: "5px" }}>
              {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
            </h2>
            
            {getFriendlyNivel() && (
              <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, marginBottom: "20px" }}>
                Nivel seleccionado: <span style={{ color: "#7c3aed" }}>{getFriendlyNivel()}</span>
              </p>
            )}

            {/* --- CAMPOS DE REGISTRO (CONDICIONALES) --- */}
            {isRegistering && (
              <>
                <InputField
                  label="Nombre Completo"
                  type="text"
                  name="nombre_completo"
                  placeholder="Nombre Completo"
                  icon="bx-user"
                  value={formData.nombre_completo}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="DNI"
                  type="text"
                  name="DNI"
                  placeholder="DNI"
                  icon="bx-id-card"
                  value={formData.DNI}
                  onChange={handleInputChange}
                  required
                />
              </>
            )}

            {/* --- Campos Comunes (Email y Contraseña) --- */}
            <InputField
              label="Correo Institucional"
              type="email"
              name="correo"
              placeholder="correo@alu.tecnica29de6.edu.ar"
              icon="bx-envelope"
              value={formData.correo}
              onChange={handleInputChange}
              required
            />
            <InputField
              label="Contraseña"
              type="password"
              name="contrasena"
              placeholder="Contraseña"
              icon="bx-lock-alt"
              value={formData.contrasena}
              onChange={handleInputChange}
              required
            />

            {/* --- CAMPOS DE ROL (CONDICIONALES) --- */}
            {isRegistering && formData.correo.endsWith(ALUMNO_DOMAIN) && (
              <InputField
                label="Curso"
                type="text"
                name="curso"
                placeholder="Curso (ej: 7mo 1ra)"
                icon="bx-group"
                value={formData.curso}
                onChange={handleInputChange}
                required
              />
            )}
            
            {isRegistering && formData.correo.endsWith(PROFESOR_DOMAIN) && (
              <InputField
                label="Materia que enseña"
                type="text"
                name="materia"
                placeholder="Materia que enseña"
                icon="bx-book"
                value={formData.materia}
                onChange={handleInputChange}
                required
              />
            )}

            {/* --- Botón de Envío Dinámico usando Botón Reutilizable --- */}
            <Button type="submit" loading={isLoading} style={{ width: "100%", marginTop: "10px" }}>
              {isRegistering ? "Registrarse" : "Iniciar Sesión"}
            </Button>
            
            {/* --- Enlace "Olvidé Contraseña" --- */}
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <Link
                to="/forgot-password"
                style={{
                  backgroundColor: "transparent",
                  color: "#3b82f6", 
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.9em" 
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* =================================== */}
            {/* SECCIÓN DE PESTAÑAS (ESTILO MEJORADO) */}
            {/* =================================== */}
            <div style={{ 
              marginTop: "20px", 
              textAlign: "center", 
              paddingTop: "15px", 
              borderTop: "1px solid #00000020" 
            }}>
              <span style={{ color: "#333" }}> 
                {isRegistering ? "¿Ya tienes una cuenta? " : "¿No tienes una cuenta? "}
              </span>
              <button
                type="button" 
                onClick={() => handleTabChange(!isRegistering)}
                style={{
                  backgroundColor: "transparent",
                  color: "#000000", 
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "none", 
                  fontFamily: "inherit",
                  fontSize: "1em",
                  fontWeight: "bold", 
                  padding: 0,
                  margin: 0,
                  marginLeft: "4px"
                }}
              >
                {isRegistering ? "Inicia Sesión" : "Regístrate"}
              </button>
            </div>

          </form>

          {/* Admin Modal usando el nuevo componente Modal Reutilizable */}
          <Modal
            isOpen={showAdminModal}
            onClose={() => setShowAdminModal(false)}
            title="Admin Login"
          >
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              Ingresa el correo y contraseña de admin para acceder al dashboard.
            </p>
            <form onSubmit={handleAdminLogin}>
              <InputField
                label="Admin mail"
                type="email"
                name="correo"
                placeholder="admin@tecnica29de6.edu.ar"
                icon="bx-envelope"
                value={adminForm.correo}
                onChange={handleAdminInputChange}
                required
              />
              <InputField
                label="Admin password"
                type="password"
                name="contrasena"
                placeholder="Contraseña de admin"
                icon="bx-lock-alt"
                value={adminForm.contrasena}
                onChange={handleAdminInputChange}
                required
              />
              {adminError && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: 600 }}>
                  {adminError}
                </div>
              )}
              <Button type="submit" style={{ width: "100%" }}>
                Entrar como Admin
              </Button>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Registro;