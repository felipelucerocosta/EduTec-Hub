import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import styles from "../Registro.module.css";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";

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
        showNotification("Contraseña restablecida con éxito. Redirigiendo...", "success");
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

          {!token ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div className={styles.formLogoMark} style={{ background: "linear-gradient(135deg, #f43f5e, #dc2626)", boxShadow: "0 0 24px rgba(244, 63, 94, 0.4)" }}>
                <i className="bx bx-error"></i>
              </div>
              <h2 className={styles.formTitle} style={{ fontSize: "1.4rem" }}>Token Inválido o Expirado</h2>
              <p className={styles.formSubtitle} style={{ marginTop: "0.5rem" }}>
                El token de recuperación no es válido o ya ha expirado. Serás redirigido al login.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.formHeader} style={{ marginBottom: "2rem" }}>
                <div className={styles.formLogoMark}>
                  <i className="bx bx-shield-alt-2"></i>
                </div>
                <h1 className={styles.formTitle}>Nueva Contraseña</h1>
                <p className={styles.formSubtitle} style={{ marginTop: "0.5rem", lineHeight: "1.5" }}>
                  Ingresa tu nueva contraseña para actualizar tu credencial de acceso a Edutech.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <InputField
                  label="Nueva Contraseña"
                  type="password"
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  icon="bx-lock-alt"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <InputField
                  label="Confirmar Nueva Contraseña"
                  type="password"
                  name="confirmPassword"
                  placeholder="Repite la contraseña"
                  icon="bx-lock-alt"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                
                <Button type="submit" loading={isLoading} style={{ width: "100%", marginTop: "0.5rem" }}>
                  Restablecer Contraseña
                </Button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;