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

const Registro: React.FC = () => {
  const [notification, setNotification] = useState<Notification>({ msg: "", type: "" });
  const [loginData, setLoginData] = useState<LoginData>({ correo: "", contrasena: "" });
  const navigate = useNavigate();

  // Simulación de cuentas institucionales registradas
  const cuentasPermitidas = [
    {
      correo: "felipe.lucero.617@alu.tecnica29de6.edu.ar",
      contrasena: "123456",
      tipo: "alumno",
    },
    {
      correo: "profesor.tecnica@tecnica29de6.edu.ar",
      contrasena: "prof123",
      tipo: "profesor",
    },
  ];

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const correo = loginData.correo.trim().toLowerCase();
    const contrasena = loginData.contrasena;

    const esAlumno = correo.endsWith("@alu.tecnica29de6.edu.ar");
    const esProfesor = correo.endsWith("@tecnica29de6.edu.ar") && !correo.includes("@alu.");

    if (!esAlumno && !esProfesor) {
      showNotification("Solo se permiten correos institucionales del colegio.", "error");
      return;
    }

    const cuenta = cuentasPermitidas.find(
      (u) => u.correo === correo && u.contrasena === contrasena
    );

    if (!cuenta) {
      showNotification("Correo o contraseña incorrectos ❌", "error");
      return;
    }

    showNotification("Inicio de sesión exitoso ✅", "success");

    // Redirigir según el tipo de usuario
    setTimeout(() => {
      if (cuenta.tipo === "alumno") navigate("/alumno");
      else if (cuenta.tipo === "profesor") navigate("/clases");
    }, 1500);
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;