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
const API_URL = "http://localhost:3001/api"; // URL base de tu backend

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
    // Limpia campos específicos al cambiar de pestaña
    setFormData(prev => ({
        ...prev,
        nombre_completo: "",
        DNI: "",
        curso: "",
        materia: ""
    }));
  };

  // --- Lógica de API: Iniciar Sesión ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { correo, contrasena } = formData;

    // Validar correo institucional
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
        if (data.rol === 'profesor') {
          navigate("/clases");
        } else if (data.rol === 'alumno') {
          navigate("/alumno");
        } else {
          showNotification("Rol de usuario desconocido.", "error");
          navigate("/");
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
    const { correo, nombre_completo, DNI, contrasena, curso, materia } = formData;
    
    const isProfesor = correo.endsWith(PROFESOR_DOMAIN);
    const isAlumno = correo.endsWith(ALUMNO_DOMAIN);

    if (!isProfesor && !isAlumno) {
      showNotification("Debe usar un correo institucional de profesor o alumno.", "error");
      return;
    }

    // Validaciones específicas para registro
    if (!nombre_completo || !DNI || !contrasena) {
      showNotification("Todos los campos obligatorios deben ser completados.", "error");
      return;
    }
    if (isAlumno && !curso) {
      showNotification("El campo 'Curso' es obligatorio para alumnos.", "error");
      return;
    }
    if (isProfesor && !materia) {
      showNotification("El campo 'Materia' es obligatorio para profesores.", "error");
      return;
    }
    if (contrasena.length < 6) { // Validación mínima de contraseña
        showNotification("La contraseña debe tener al menos 6 caracteres.", "error");
        return;
    }


    const endpoint = isProfesor ? `${API_URL}/registro-profesor` : `${API_URL}/registro-alumno`;
    
    const body = {
      nombre_completo,
      correo,
      DNI,
      contrasena,
      ...(isAlumno && { curso }),
      ...(isProfesor && { materia }),
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.text(); // Tu API de registro.ts devuelve texto plano

      if (response.ok) {
        showNotification(data, "success"); // "Registro exitoso..."
        setIsRegistering(false); // Vuelve a la pestaña de Login
        // Limpia el formulario (excepto el correo/pass para facilitar el login si se desea)
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
          
          {/* --- Pestañas de Login / Registro --- */}
          <div className={styles.tabContainer}> {/* Asegúrate de que tienes estilos para 'tabContainer' y 'tabButton' en Registro.module.css */}
            <button
              className={`${styles.tabButton} ${!isRegistering ? styles.activeTab : ''}`}
              onClick={() => handleTabChange(false)}
            >
              Iniciar Sesión
            </button>
            <button
              className={`${styles.tabButton} ${isRegistering ? styles.activeTab : ''}`}
              onClick={() => handleTabChange(true)}
            >
              Registrarse
            </button>
          </div>

          {/* --- Formulario Dinámico --- */}
          <form onSubmit={isRegistering ? handleRegistro : handleLogin}>
            <h2 style={{ color: "black" }}>
              {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
            </h2>

            {/* --- Campos de Registro (Condicional) --- */}
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

            {/* --- Campos Comunes (Correo y Contraseña) --- */}
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

            {/* --- Campos de Rol (Condicional para Registro) --- */}
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

            {/* --- Botón de Envío --- */}
            <button type="submit">
              {isRegistering ? "Registrarse" : "Iniciar Sesión"}
            </button>
            
            {/* --- Enlace "Olvidaste Contraseña" --- */}
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <Link
                to="/forgot-password"
                style={{
                  backgroundColor: "transparent",
                  color: "#007bff",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registro;