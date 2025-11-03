import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components reutilizables/header";
import styles from "../Registro.module.css";

interface Notification {
  msg: string;
  type: "success" | "error" | "";
}

interface LoginData {
  correo: string;
  contrasena: string;
}

interface PasswordGenerationState {
  isGenerating: boolean;
  generatedPassword: string;
}

const Registro: React.FC = () => {
  const [notification, setNotification] = useState<Notification>({ msg: "", type: "" });
  const [loginData, setLoginData] = useState<LoginData>({ correo: "", contrasena: "" });
  const [passwordGen, setPasswordGen] = useState<PasswordGenerationState>({ isGenerating: false, generatedPassword: "" });
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const navigate = useNavigate();

  // Simulación de cuentas institucionales registradas

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const correo = loginData.correo.trim().toLowerCase();
    const contrasena = loginData.contrasena;

    const esAlumno = correo.endsWith("@alu.tecnica29de6.edu.ar");
    const esProfesor = correo.endsWith("@tecnica29de6.edu.ar") && !correo.includes("@alu.");

    if (!esAlumno && !esProfesor) {
      showNotification("Solo se permiten correos institucionales del colegio.", "error");
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Inicio de sesión exitoso ✅", "success");

        // Redirigir según el rol del usuario
        setTimeout(() => {
          if (data.usuario.rol === "alumno") navigate("/alumno");
          else if (data.usuario.rol === "profesor") navigate("/clases");
        }, 1500);
      } else {
        showNotification(data.message || "Correo o contraseña incorrectos ❌", "error");
      }
    } catch (error) {
      console.error('Error en login:', error);
      showNotification("Error de conexión. Inténtalo de nuevo.", "error");
    }
  };

  const generatePassword = async () => {
    if (!loginData.correo.trim()) {
      showNotification("Ingresa tu correo institucional primero.", "error");
      return;
    }

    const correo = loginData.correo.trim().toLowerCase();
    const esInstitucional = correo.endsWith("@alu.tecnica29de6.edu.ar") || correo.endsWith("@tecnica29de6.edu.ar");

    if (!esInstitucional) {
      showNotification("Solo se permiten correos institucionales.", "error");
      return;
    }

    setPasswordGen({ isGenerating: true, generatedPassword: "" });

    try {
      const response = await fetch('http://localhost:3001/api/generate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: correo }),
      });

      const data = await response.json();

      if (data.password) {
        setPasswordGen({ isGenerating: false, generatedPassword: data.password });
        showNotification("Contraseña generada. Cópiala y regístrate.", "success");
      } else {
        throw new Error(data.error || 'Error generando contraseña');
      }
    } catch (error) {
      console.error('Error generando contraseña:', error);
      setPasswordGen({ isGenerating: false, generatedPassword: "" });
      showNotification("Error generando contraseña. Inténtalo de nuevo.", "error");
    }
  };

  const handleForgotPassword = async () => {
    if (!loginData.correo.trim()) {
      showNotification("Ingresa tu correo institucional.", "error");
      return;
    }

    const correo = loginData.correo.trim().toLowerCase();
    const esInstitucional = correo.endsWith("@alu.tecnica29de6.edu.ar") || correo.endsWith("@tecnica29de6.edu.ar");

    if (!esInstitucional) {
      showNotification("Solo se permiten correos institucionales.", "error");
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Si existe una cuenta con ese correo, se ha enviado un enlace de recuperación.", "success");
      } else {
        showNotification(data.message || "Error enviando email de recuperación.", "error");
      }
    } catch (error) {
      console.error('Error en forgot password:', error);
      showNotification("Error de conexión. Inténtalo de nuevo.", "error");
    }
  };

  return (
    <div className={styles.loginRegisterBody}>
      <Header />

      <div className={styles.loginRegisterContainer}>
        {notification.msg && (
          <div className={`${styles.notification} ${notification.type ? styles[notification.type] : ""}`}>
            {notification.msg}
          </div>
        )}

        <div className={styles.containerPrincipal}>
          <div className={`${styles.formContainer} ${styles.signInContainer}`}>
            <form onSubmit={handleLogin}>
              <h1>Iniciar Sesión</h1>
              <p style={{ fontSize: "14px", marginBottom: "10px" }}>
                Solo se permiten cuentas institucionales del colegio
              </p>
              <input
                type="email"
                placeholder="Correo institucional"
                name="correo"
                value={loginData.correo}
                onChange={handleInputChange}
                required
              />
              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña"
                value={loginData.contrasena}
                onChange={handleInputChange}
                required
              />
              <button type="submit">Entrar</button>
            </form>

            {/* Botón para generar contraseña con Alfred */}
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <button
                type="button"
                onClick={generatePassword}
                disabled={passwordGen.isGenerating}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: passwordGen.isGenerating ? "not-allowed" : "pointer",
                  marginBottom: "10px"
                }}
              >
                {passwordGen.isGenerating ? "Generando..." : "Generar Contraseña con Alfred"}
              </button>
              {passwordGen.generatedPassword && (
                <div style={{
                  backgroundColor: "#f8f9fa",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #dee2e6",
                  marginTop: "10px"
                }}>
                  <strong>Contraseña generada:</strong>
                  <div style={{
                    fontFamily: "monospace",
                    backgroundColor: "#e9ecef",
                    padding: "5px",
                    borderRadius: "3px",
                    marginTop: "5px",
                    wordBreak: "break-all"
                  }}>
                    {passwordGen.generatedPassword}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(passwordGen.generatedPassword)}
                    style={{
                      marginTop: "5px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Copiar
                  </button>
                </div>
              )}
            </div>

            {/* Botón para "¿Olvidaste tu contraseña?" */}
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                style={{
                  backgroundColor: "transparent",
                  color: "#007bff",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
              {showForgotPassword && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Enviar enlace de recuperación
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;