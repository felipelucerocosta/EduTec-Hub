import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";
import InputField from "../components reutilizables/InputField";
import Modal from "../components reutilizables/Modal";
import styles from "../Registro.module.css";
import { API_URL } from "../config/api";

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
  confirmar_contrasena?: string;
  curso: string;
  materia: string;
  nivel_educativo: string;
  turno?: string;
}

type Role = "alumno" | "profesor" | "preceptor";

// ─── Component ────────────────────────────────────────────
const Registro: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlNivel = searchParams.get("nivel") || "Secundario";

  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role>("alumno");
  const [notification, setNotification] = useState<Notification>({ msg: "", type: "" });
  const [formData, setFormData] = useState<FormData>({
    nombre_completo: "",
    DNI: "",
    correo: "",
    contrasena: "",
    confirmar_contrasena: "",
    curso: "",
    materia: "",
    nivel_educativo: urlNivel,
    turno: "Turno Mañana",
  });
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminForm, setAdminForm] = useState({ correo: "", contrasena: "" });
  const [adminError, setAdminError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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
        login({
          ...data.usuario,
          rol: 'admin' as const,
          estado_acceso: 'ACTIVO',
          isAdmin: true
        });
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
        // ✅ Actualizar AuthContext con los datos completos del usuario ANTES de navegar.
        login({
          id: data.usuario.id,
          nombre: data.usuario.nombre,
          correo: data.usuario.correo,
          rol: data.usuario.rol as 'alumno' | 'profesor' | 'admin' | 'preceptor',
          estado_acceso: data.usuario.estado_acceso || 'ACTIVO',
          isAdmin: data.usuario.isAdmin || data.usuario.rol === 'admin',
        });
        showNotification("¡Bienvenido de nuevo!", "success");
        // Redirigir según rol
        const destino = data.usuario.rol === 'profesor' ? '/clases'
          : data.usuario.rol === 'admin' ? '/admin'
          : data.usuario.rol === 'preceptor' ? '/preceptoria'
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

    if (formData.confirmar_contrasena && formData.contrasena !== formData.confirmar_contrasena) {
      showNotification("Las contraseñas no coinciden. Por favor verifícalas.", "error");
      return;
    }

    if (formData.contrasena.length < 6) {
      showNotification("La contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }

    const isProfesor = selectedRole === "profesor";
    const isPreceptor = selectedRole === "preceptor";
    const endpoint = isProfesor
      ? `${API_URL}/registro-profesor`
      : isPreceptor
      ? `${API_URL}/registro-preceptor`
      : `${API_URL}/registro-alumno`;

    const body = {
      nombre_completo: formData.nombre_completo,
      correo: formData.correo,
      DNI: formData.DNI,
      contrasena: formData.contrasena,
      nivel_educativo: formData.nivel_educativo,
      ...(isProfesor ? { materia: formData.materia } : {}),
      ...(selectedRole === "alumno" ? { curso: formData.curso } : {}),
      ...(isPreceptor ? { turno: formData.turno || 'Turno Mañana' } : {}),
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
        showNotification(
          isPreceptor
            ? "¡Cuenta de Preceptor creada exitosamente! Ahora inicia sesión."
            : "¡Cuenta creada exitosamente! Ahora inicia sesión.",
          "success"
        );
        setIsRegistering(false);
        setFormData({
          nombre_completo: "",
          DNI: "",
          correo: "",
          contrasena: "",
          confirmar_contrasena: "",
          curso: "",
          materia: "",
          nivel_educativo: urlNivel,
          turno: "Turno Mañana"
        });
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
              src="/emblema-edge.png"
              alt="EduTech — Emblema Edge"
              style={{
                width: "124px",
                height: "124px",
                objectFit: "contain",
                margin: "0 auto 1.25rem",
                display: "block",
                filter: "drop-shadow(0 0 24px rgba(121, 41, 210, 0.55))"
              }}
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
            {/* Dummy fields to prevent Chrome/Edge autofill */}
            <input type="text" name="fake_user_prevent_autofill" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="fake_pass_prevent_autofill" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

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
                  <button
                    type="button"
                    className={`${styles.roleOption} ${selectedRole === "preceptor" ? styles.roleOptionActive : ""}`}
                    onClick={() => setSelectedRole("preceptor")}
                  >
                    <i className="bx bx-id-card"></i>
                    Preceptor
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
              autoComplete="one-time-code"
              required
            />

            {/* Confirm password (register only) */}
            {isRegistering && (
              <InputField
                label="Confirmar Contraseña"
                type="password"
                name="confirmar_contrasena"
                placeholder="Repite tu contraseña"
                icon="bx-check-shield"
                value={formData.confirmar_contrasena || ""}
                onChange={handleInputChange}
                autoComplete="one-time-code"
                required
              />
            )}

            {/* Forgot password (login only) */}
            {!isRegistering && (
              <Link to="/forgot-password" className={styles.forgotPasswordLink}>
                ¿Olvidaste tu contraseña?
              </Link>
            )}

            {/* Nivel Educativo (register only) */}
            {isRegistering && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                  Nivel Educativo
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    name="nivel_educativo"
                    value={formData.nivel_educativo}
                    onChange={(e) => setFormData(prev => ({ ...prev, nivel_educativo: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.5rem",
                      borderRadius: "12px",
                      background: "rgba(30, 41, 59, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Inicial">Nivel Inicial (Jardín)</option>
                    <option value="Primario">Nivel Primario</option>
                    <option value="Secundario">Nivel Secundario Técnico</option>
                    <option value="Terciario">Nivel Terciario</option>
                  </select>
                  <i className="bx bx-graduation" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#a78bfa", fontSize: "1.1rem" }}></i>
                </div>
              </div>
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

            {isRegistering && selectedRole === "preceptor" && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                  Turno Institucional Asignado
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    name="turno"
                    value={formData.turno || "Turno Mañana"}
                    onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.5rem",
                      borderRadius: "12px",
                      background: "rgba(30, 41, 59, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Turno Mañana">Turno Mañana</option>
                    <option value="Turno Tarde">Turno Tarde</option>
                    <option value="Turno Vespertino">Turno Vespertino</option>
                    <option value="Jornada Completa">Jornada Completa (Mañana y Tarde)</option>
                  </select>
                  <i className="bx bx-time-five" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#34d399", fontSize: "1.1rem" }}></i>
                </div>
                <div style={{
                  marginTop: "0.6rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  color: "#a7f3d0",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}>
                  <i className="bx bx-id-card" style={{ fontSize: "1rem", color: "#34d399" }}></i>
                  <span>Cuenta con permisos de preceptoría escolar: registro de asistencias, nóminas y constancias.</span>
                </div>
              </div>
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
              <input type="text" name="fake_admin_email" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
              <input type="password" name="fake_admin_pass" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
              <InputField
                label="Correo de Admin"
                type="email"
                name="correo"
                placeholder="admin@correo.com"
                icon="bx-envelope"
                value={adminForm.correo}
                onChange={handleAdminInputChange}
                autoComplete="one-time-code"
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
                autoComplete="one-time-code"
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