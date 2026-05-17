import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "../Registro.module.css"; // Reutilizamos los estilos
import Header from "../components reutilizables/header";

interface Notification {
  msg: string;
  type: "success" | "error" | "";
}

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notification, setNotification] = useState<Notification>({ msg: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      showNotification("Token inválido o faltante.", "error");
      // Opcional: redirigir al login después de un tiempo
      setTimeout(() => navigate("/"), 3000);
    }
    setToken(tokenFromUrl);
  }, [searchParams, navigate]);

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showNotification("Las contraseñas no coinciden.", "error");
      return;
    }
    if (password.length < 6) {
      showNotification("La contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }
    if (!token) {
      showNotification("Token inválido.", "error");
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, contrasena: password }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification("Contraseña restablecida con éxito. Serás redirigido al login.", "success");
        setTimeout(() => navigate("/"), 3000);
      } else {
        throw new Error(data.message || "Error al restablecer la contraseña.");
      }
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.loginRegisterBody}>
        <Header />
        {notification.msg && (
          <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.msg}
          </div>
        )}
        <h2 style={{color: "white"}}>Token inválido...</h2>
      </div>
    );
  }

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
            <h2 style={{color: "black"}}>Nueva Contraseña</h2>
            <div className={styles.formGroup}>
              <input
                type="password"
                placeholder="Nueva Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <input
                type="password"
                placeholder="Confirmar Nueva Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Restablecer Contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;