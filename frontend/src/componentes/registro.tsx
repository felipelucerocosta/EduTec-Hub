import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import Modal from "../components reutilizables/Modal";
import styles from "../Registro.module.css";

// ─── Types ────────────────────────────────────────────────
interface Notification {
  msg: string;
  type: "success" | "error" | "";
}

interface FormData {
  nombre_completo: string;
  DNI: string;
  correo: string;
  contrasena: string;
  curso: string;
  materia: string;
}

type Role = "alumno" | "profesor";

// ─── Constants ────────────────────────────────────────────
const API_URL = "http://localhost:3001/api";

// ─── Component ────────────────────────────────────────────
const Registro: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role>("alumno");
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

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Helpers ──────────────────────────────────────────────
  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 4500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTabChange = (registering: boolean) => {
    setIsRegistering(registering);
    setNotification({ msg: "", type: "" });
  };

  // ── Admin Login ──────────────────────────────────────────
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
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setAdminError(data.message || "Credenciales de admin incorrectas.");
        return;
      }
      // ✅ Actualizar AuthContext antes de navegar
      if (data.usuario) {
        login({ ...data.usuario, rol: 'admin' as const });
      }
      navigate("/admin");
    } catch (error: any) {
      setAdminError(error.message || "Error de conexión con el servidor.");
    }
  };

  // ── Login ────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { correo, contrasena } = formData;
    if (!correo || !contrasena) {
      showNotification("Por favor completa todos los campos.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.usuario) {
        // ✅ Actualizar AuthContext con los datos del usuario ANTES de navegar.
        // Sin esto, ProtectedRoute encuentra user=null y redirige de vuelta al login.
        login({
          id: data.usuario.id,
          nombre: data.usuario.nombre,
          correo: data.usuario.correo,
          rol: data.usuario.rol as 'alumno' | 'profesor' | 'admin',
        });
        showNotification("¡Bienvenido de nuevo!", "success");
        // Redirigir según rol
        const destino = data.usuario.rol === 'profesor' ? '/clases'
          : data.usuario.rol === 'admin' ? '/admin'
          : '/dashboard';
        setTimeout(() => navigate(destino), 300);
      } else if (response.ok) {
        // Respuesta OK pero sin datos de usuario: raro, pero manejamos igual
        showNotification("¡Bienvenido de nuevo!", "success");
        setTimeout(() => navigate('/dashboard'), 300);
      } else {
        throw new Error(data.message || "Credenciales incorrectas.");
      }
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register ─────────────────────────────────────────────
  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();

    const isProfesor = selectedRole === "profesor";
    const endpoint = isProfesor
      ? `${API_URL}/registro-profesor`
      : `${API_URL}/registro-alumno`;

    const body = {
      nombre_completo: formData.nombre_completo,
      correo: formData.correo,
      DNI: formData.DNI,
      contrasena: formData.contrasena,
      ...(isProfesor ? { materia: formData.materia } : { curso: formData.curso }),
    };

    setIsLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      // Try parsing JSON first, fall back to text
      let data: any;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (response.ok) {
        showNotification("¡Cuenta creada exitosamente! Ahora inicia sesión.", "success");
        setIsRegistering(false);
        setFormData({ nombre_completo: "", DNI: "", correo: "", contrasena: "", curso: "", materia: "" });
      } else {
        throw new Error(data.error || data.message || "Error al crear la cuenta.");
      }
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const nivel = searchParams.get("nivel");

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className={styles.loginRegisterBody}>
      <Header showLogout={false} />

      {/* Notification Toast */}
      {notification.msg && (
        <div className={`${styles.notification} ${notification.type === "success" ? styles.success : styles.error}`}>
          <i className={`bx ${notification.type === "success" ? "bx-check-circle" : "bx-error-circle"}`}></i>
          {notification.msg}
        </div>
      )}

      <div className={styles.loginRegisterContainer}>
        <div className={styles.containerPrincipal}>

          {/* Top row: back link */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
            <Link to="/" className={styles.backLink}>
              <i className="bx bx-arrow-back"></i>
              Volver
            </Link>
          </div>

          {/* Form header */}
          <div className={styles.formHeader}>
            <img
              src="/edutech-logo.png"
              alt="Edutech Logo"
              style={{ width: "52px", height: "52px", objectFit: "contain", borderRadius: "10px", margin: "0 auto 1rem", display: "block" }}
            />
            <h1 className={styles.formTitle}>
              {isRegistering ? "Crear Cuenta" : "Bienvenido"}
            </h1>
            <p className={styles.formSubtitle}>
              {isRegistering
                ? "Completa los datos para unirte a Edutech"
                : "Inicia sesión para acceder a tu aula"}
            </p>
            {nivel && (
              <div style={{ marginTop: "0.75rem", padding: "0.35rem 0.85rem", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "50px", display: "inline-block" }}>
                <span style={{ color: "#a78bfa", fontSize: "0.78rem", fontWeight: 600 }}>
                  Nivel: {nivel}
                </span>
              </div>
            )}
          </div>

          {/* Tab switcher */}
          <div className={styles.tabSwitcher}>
            <button
              type="button"
              className={`${styles.tabBtn} ${!isRegistering ? styles.tabBtnActive : ""}`}
              onClick={() => handleTabChange(false)}
            >
              <i className="bx bx-log-in" style={{ marginRight: "0.3rem" }}></i>
              Iniciar Sesión
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${isRegistering ? styles.tabBtnActive : ""}`}
              onClick={() => handleTabChange(true)}
            >
              <i className="bx bx-user-plus" style={{ marginRight: "0.3rem" }}></i>
              Crear Cuenta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={isRegistering ? handleRegistro : handleLogin} autoComplete="off">

            {/* Role selector (register only) */}
            {isRegistering && (
              <>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                  Soy...
                </p>
                <div className={styles.roleSelector}>
                  <button
                    type="button"
                    className={`${styles.roleOption} ${selectedRole === "alumno" ? styles.roleOptionActive : ""}`}
                    onClick={() => setSelectedRole("alumno")}
                  >
                    <i className="bx bx-book-reader"></i>
                    Alumno
                  </button>
                  <button
                    type="button"
                    className={`${styles.roleOption} ${selectedRole === "profesor" ? styles.roleOptionActive : ""}`}
                    onClick={() => setSelectedRole("profesor")}
                  >
                    <i className="bx bx-chalkboard"></i>
                    Profesor
                  </button>
                </div>
              </>
            )}

            {/* Register-only fields */}
            {isRegistering && (
              <>
                <InputField
                  label="Nombre Completo"
                  type="text"
                  name="nombre_completo"
                  placeholder="Ej: Juan Pérez"
                  icon="bx-user"
                  value={formData.nombre_completo}
                  onChange={handleInputChange}
                  autoComplete="off"
                  required
                />
                <InputField
                  label="DNI"
                  type="text"
                  name="DNI"
                  placeholder="Número de documento"
                  icon="bx-id-card"
                  value={formData.DNI}
                  onChange={handleInputChange}
                  autoComplete="off"
                  required
                />
              </>
            )}

            {/* Common fields */}
            <InputField
              label="Correo Electrónico"
              type="email"
              name="correo"
              placeholder="tu@correo.com"
              icon="bx-envelope"
              value={formData.correo}
              onChange={handleInputChange}
              autoComplete="off"
              required
            />
            <InputField
              label="Contraseña"
              type="password"
              name="contrasena"
              placeholder="••••••••"
              icon="bx-lock-alt"
              value={formData.contrasena}
              onChange={handleInputChange}
              autoComplete={isRegistering ? "new-password" : "current-password"}
              required
            />

            {/* Forgot password (login only) */}
            {!isRegistering && (
              <Link to="/forgot-password" className={styles.forgotPasswordLink}>
                ¿Olvidaste tu contraseña?
              </Link>
            )}

            {/* Role-specific fields (register only) */}
            {isRegistering && selectedRole === "alumno" && (
              <InputField
                label="Curso"
                type="text"
                name="curso"
                placeholder="Ej: 3ro 1ra"
                icon="bx-group"
                value={formData.curso}
                onChange={handleInputChange}
                required
              />
            )}

            {isRegistering && selectedRole === "profesor" && (
              <InputField
                label="Materia que enseña"
                type="text"
                name="materia"
                placeholder="Ej: Matemática"
                icon="bx-book"
                value={formData.materia}
                onChange={handleInputChange}
                required
              />
            )}

            <Button type="submit" loading={isLoading} style={{ width: "100%", marginTop: "0.5rem" }}>
              {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
            </Button>

            <div className={styles.switchText}>
              {isRegistering ? "¿Ya tenés una cuenta? " : "¿No tenés una cuenta? "}
              <button
                type="button"
                className={styles.switchLink}
                onClick={() => handleTabChange(!isRegistering)}
              >
                {isRegistering ? "Inicia Sesión" : "Regístrate"}
              </button>
            </div>
          </form>

          {/* Admin Modal */}
          <Modal
            isOpen={showAdminModal}
            onClose={() => { setShowAdminModal(false); setAdminError(""); }}
            title="🛡 Acceso Administrador"
          >
            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              Ingresa el correo y contraseña del administrador para acceder al panel de control.
            </p>
            <form onSubmit={handleAdminLogin} autoComplete="off">
              <InputField
                label="Correo de Admin"
                type="email"
                name="correo"
                placeholder="admin@correo.com"
                icon="bx-envelope"
                value={adminForm.correo}
                onChange={handleAdminInputChange}
                autoComplete="off"
                required
              />
              <InputField
                label="Contraseña de Admin"
                type="password"
                name="contrasena"
                placeholder="••••••••"
                icon="bx-lock-alt"
                value={adminForm.contrasena}
                onChange={handleAdminInputChange}
                autoComplete="new-password"
                required
              />
              {adminError && (
                <div className={styles.adminError}>
                  <i className="bx bx-error-circle" style={{ marginRight: "0.35rem" }}></i>
                  {adminError}
                </div>
              )}
              <Button type="submit" style={{ width: "100%", marginTop: "1rem" }}>
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