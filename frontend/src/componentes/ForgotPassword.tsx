import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "../Registro.module.css";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";

interface Notification {
  msg: string;
  type: "success" | "error" | "";
}

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [notification, setNotification] = useState<Notification>({ msg: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showNotification("Por favor, ingrese su correo.", "error");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification("Se ha enviado un enlace de recuperación a su correo.", "success");
        setEmail("");
      } else {
        throw new Error(data.message || "Error al enviar el correo.");
      }
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginRegisterBody}>
      <Header showLogout={false} />
      
      {notification.msg && (
        <div className={`${styles.notification} ${notification.type === "success" ? styles.success : styles.error}`}>
          <i className={`bx ${notification.type === "success" ? "bx-check-circle" : "bx-error-circle"}`}></i>
          {notification.msg}
        </div>
      )}

      <div className={styles.loginRegisterContainer}>
        <div className={styles.containerPrincipal} style={{ width: "min(460px, calc(100vw - 2rem))" }}>
          
          <Link to="/registro" className={styles.backLink}>
            <i className="bx bx-arrow-back"></i>
            Volver al Login
          </Link>

          <div className={styles.formHeader} style={{ marginBottom: "2rem" }}>
            <div className={styles.formLogoMark}>
              <i className="bx bx-key"></i>
            </div>
            <h1 className={styles.formTitle}>¿Olvidaste tu contraseña?</h1>
            <p className={styles.formSubtitle} style={{ marginTop: "0.5rem", lineHeight: "1.5" }}>
              Ingresa tu dirección de correo electrónico registrado y te enviaremos un enlace de recuperación.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <InputField
              label="Correo Electrónico"
              type="email"
              name="correo"
              placeholder="tu@correo.com"
              icon="bx-envelope"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Button type="submit" loading={isLoading} style={{ width: "100%", marginTop: "0.5rem" }}>
              Enviar Enlace
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;