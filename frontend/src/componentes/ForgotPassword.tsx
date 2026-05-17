import React, { useState } from "react";
import styles from "../Registro.module.css"; // Reutilizamos los estilos de Registro
import Header from "../components reutilizables/header";

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
      <Header />
      {notification.msg && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.msg}
        </div>
      )}
      <div className={styles.loginRegisterContainer}>
        <div className={styles.containerPrincipal} style={{ width: "450px" }}>
          <form onSubmit={handleSubmit}>
            <h2 style={{color: "black"}}>Restablecer Contraseña</h2>
            <p style={{color: "black", marginBottom: "20px"}}>
              Ingrese su correo electrónico y le enviaremos un enlace para restablecer su contraseña.
            </p>
            <div className={styles.formGroup}>
              <input
                type="email"
                name="correo"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Enlace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;