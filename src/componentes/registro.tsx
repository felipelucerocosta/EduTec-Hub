import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components reutilizables/header";
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
  
  const navigate = useNavigate();

  // --- Funciones Auxiliares ---
  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- Lógica de Pestañas ---
  const handleTabChange = (registering: boolean) => {
    setIsRegistering(registering);
    setNotification({ msg: "", type: "" }); // Limpia notificaciones al cambiar
  };

  // --- Lógica de API: Iniciar Sesión (CORREGIDA) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { correo, contrasena } = formData;
    
    if (!correo.endsWith(ALUMNO_DOMAIN) && !correo.endsWith(PROFESOR_DOMAIN)) {
      showNotification("Por favor, use un correo institucional para iniciar sesión.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });
      
      const data = await response.json(); 

      if (response.ok) {
        showNotification(data.message, "success");

        // Corrección (Rol desconocido):
        if (data.usuario && data.usuario.rol === 'profesor') {
          navigate("/clases");
        } else if (data.usuario && data.usuario.rol === 'alumno') {
          navigate("/alumno");
        } else {
          showNotification("Rol de usuario desconocido.", "error");
        }
      } else {
        throw new Error(data.message || "Error al iniciar sesión");
      }
    } catch (error: any) {
      showNotification(error.message, "error");
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
    }
  };

  // --- Renderizado ---
  return (
    <div className={styles.loginRegisterBody}>
      <Header />
      {notification.msg && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.msg}
        </div>
      )}
      <div className={styles.loginRegisterContainer}>
        <div className={styles.containerPrincipal}>
          
          <form onSubmit={isRegistering ? handleRegistro : handleLogin}>
            <h2 style={{ color: "black" }}>
              {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
            </h2>

            {/* --- CAMPOS DE REGISTRO (CONDICIONALES) --- */}
            {isRegistering && (
              <>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="nombre_completo"
                    placeholder="Nombre Completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="DNI"
                    placeholder="DNI"
                    value={formData.DNI}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            {/* --- Campos Comunes (Email y Contraseña) --- */}
            <div className={styles.formGroup}>
              <input
                type="email"
                name="correo"
                placeholder="Correo Institucional"
                value={formData.correo}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña"
                value={formData.contrasena}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* --- CAMPOS DE ROL (CONDICIONALES) --- */}
            {isRegistering && formData.correo.endsWith(ALUMNO_DOMAIN) && (
              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="curso"
                  placeholder="Curso (ej: 7mo 1ra)"
                  value={formData.curso}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}
            
            {isRegistering && formData.correo.endsWith(PROFESOR_DOMAIN) && (
              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="materia"
                  placeholder="Materia que enseña"
                  value={formData.materia}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            {/* --- Botón de Envío Dinámico --- */}
            <button type="submit">
              {isRegistering ? "Registrarse" : "Iniciar Sesión"}
            </button>
            
            {/* --- Enlace "Olvidé Contraseña" --- */}
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <Link
                to="/forgot-password"
                style={{
                  backgroundColor: "transparent",
                  color: "#007bff", // Mantenemos el azul para "Olvidé contraseña"
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.9em" // Un poco más pequeño
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
              borderTop: "1px solid #00000020" // <-- Corregido el typo y color más suave
            }}>
              <span style={{ color: '#333' }}> {/* Texto más suave */}
                {isRegistering ? "¿Ya tienes una cuenta? " : "¿No tienes una cuenta? "}
              </span>
              <button
                type="button" 
                onClick={() => handleTabChange(!isRegistering)}
                style={{
                  backgroundColor: "transparent",
                  color: "#000000", // Color negro
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "none", // Sin subrayado
                  fontFamily: "inherit",
                  fontSize: "1em",
                  fontWeight: "bold", // En negrita
                  padding: 0,
                  margin: 0,
                  marginLeft: "4px"
                }}
              >
                {isRegistering ? "Inicia Sesión" : "Regístrate"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Registro;