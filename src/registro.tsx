import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import Header from "../src/components reutilizables/header";
import styles from "./Registro.module.css";

// ---- Interfaces ----
interface Notification {
  msg: string;
  type: "success" | "error" | "";
}
interface LoginData {
  correo: string;
  contrasena: string;
}
interface AlumnoData {
  nombre_completo: string;
  correo: string;
  curso: string;
  DNI: string;
  contrasena: string;
}
interface ProfesorData {
  nombre_completo: string;
  correo: string;
  materia: string;
  DNI: string;
  contrasena: string;
}

const Registro: React.FC = () => {
  const [view, setView] = useState<"login" | "regAlumno" | "regProfesor">("login");
  const [notification, setNotification] = useState<Notification>({ msg: "", type: "" });
  const [loginData, setLoginData] = useState<LoginData>({ correo: "", contrasena: "" });
  const [alumnoData, setAlumnoData] = useState<AlumnoData>({
    nombre_completo: "",
    correo: "",
    curso: "",
    DNI: "",
    contrasena: "",
  });
  const [profesorData, setProfesorData] = useState<ProfesorData>({
    nombre_completo: "",
    correo: "",
    materia: "",
    DNI: "",
    contrasena: "",
  });
  const [alumnos, setAlumnos] = useState<AlumnoData[]>([]);
  const [profesores, setProfesores] = useState<ProfesorData[]>([]);

  const navigate = useNavigate();

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 4000);
  };

  const handleInputChange = <T,>(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<T>>
  ) => {
    setter((prev) => ({ ...prev, [e.target.name]: e.target.value } as T));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const alumno = alumnos.find(
      (a) => a.correo === loginData.correo && a.contrasena === loginData.contrasena
    );
    const profesor = profesores.find(
      (p) => p.correo === loginData.correo && p.contrasena === loginData.contrasena
    );

    if (alumno || profesor) {
      showNotification("Login exitoso ✅", "success");
      navigate("/clases");
    } else {
      showNotification("Correo o contraseña incorrectos", "error");
    }
  };

  const handleRegister = (e: React.FormEvent, type: "alumno" | "profesor") => {
    e.preventDefault();
    if (type === "alumno") {
      setAlumnos((prev) => [...prev, alumnoData]);
      showNotification("Alumno registrado exitosamente", "success");
      setAlumnoData({ nombre_completo: "", correo: "", curso: "", DNI: "", contrasena: "" });
    } else {
      setProfesores((prev) => [...prev, profesorData]);
      showNotification("Profesor registrado exitosamente", "success");
      setProfesorData({ nombre_completo: "", correo: "", materia: "", DNI: "", contrasena: "" });
    }
    setView("login");
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

        <div
          className={`${styles.containerPrincipal} ${view !== "login" ? styles.rightPanelActive : ""}`}
        >
          {/* Registro Alumno */}
          <div className={`${styles.formContainer} ${styles.signUpContainer}`}>
            <form
              onSubmit={(e) => handleRegister(e, "alumno")}
              style={{ display: view === "regAlumno" ? "flex" : "none" }}
            >
              <h1>Crear Cuenta de Alumno</h1>
              <input
                type="text"
                name="nombre_completo"
                placeholder="Nombre Completo"
                value={alumnoData.nombre_completo}
                onChange={(e) => handleInputChange<AlumnoData>(e, setAlumnoData)}
                required
              />
              <input
                type="email"
                name="correo"
                placeholder="Correo Electrónico"
                value={alumnoData.correo}
                onChange={(e) => handleInputChange<AlumnoData>(e, setAlumnoData)}
                required
              />
              <input
                type="text"
                name="curso"
                placeholder="Curso"
                value={alumnoData.curso}
                onChange={(e) => handleInputChange<AlumnoData>(e, setAlumnoData)}
                required
              />
              <input
                type="text"
                name="DNI"
                placeholder="DNI"
                value={alumnoData.DNI}
                onChange={(e) => handleInputChange<AlumnoData>(e, setAlumnoData)}
                required
              />
              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña"
                value={alumnoData.contrasena}
                onChange={(e) => handleInputChange<AlumnoData>(e, setAlumnoData)}
                required
              />
              <button type="submit">Registrarse</button>
            </form>

            {/* Registro Profesor */}
            <form
              onSubmit={(e) => handleRegister(e, "profesor")}
              style={{ display: view === "regProfesor" ? "flex" : "none" }}
            >
              <h1>Crear Cuenta de Profesor</h1>
              <input
                type="text"
                name="nombre_completo"
                placeholder="Nombre Completo"
                value={profesorData.nombre_completo}
                onChange={(e) => handleInputChange<ProfesorData>(e, setProfesorData)}
                required
              />
              <input
                type="email"
                name="correo"
                placeholder="Correo Electrónico"
                value={profesorData.correo}
                onChange={(e) => handleInputChange<ProfesorData>(e, setProfesorData)}
                required
              />
              <input
                type="text"
                name="materia"
                placeholder="Materia"
                value={profesorData.materia}
                onChange={(e) => handleInputChange<ProfesorData>(e, setProfesorData)}
                required
              />
              <input
                type="text"
                name="DNI"
                placeholder="DNI"
                value={profesorData.DNI}
                onChange={(e) => handleInputChange<ProfesorData>(e, setProfesorData)}
                required
              />
              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña"
                value={profesorData.contrasena}
                onChange={(e) => handleInputChange<ProfesorData>(e, setProfesorData)}
                required
              />
              <button type="submit">Registrarse</button>
            </form>
          </div>

          {/* Login */}
          <div className={`${styles.formContainer} ${styles.signInContainer}`}>
            <form onSubmit={handleLogin}>
              <h1>Iniciar Sesión</h1>
              <input
                type="email"
                placeholder="Correo Electrónico"
                name="correo"
                value={loginData.correo}
                onChange={(e) => handleInputChange<LoginData>(e, setLoginData)}
                required
              />
              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña"
                value={loginData.contrasena}
                onChange={(e) => handleInputChange<LoginData>(e, setLoginData)}
                required
              />
              <button type="submit">Entrar</button>
            </form>
          </div>

          {/* Paneles */}
          <div className={styles.overlayContainer}>
            <div className={styles.overlay}>
              <div className={`${styles.overlayPanel} ${styles.overlayLeft}`}>
                <h1>¡Bienvenido de vuelta!</h1>
                <p>
                  Para mantenerte conectado, por favor inicia sesión con tu información personal
                </p>
                <button className={styles.ghost} onClick={() => setView("login")}>
                  Iniciar Sesión
                </button>
              </div>
              <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
                <h1>¿Aún no tienes cuenta?</h1>
                <p>Elige tu rol para empezar tu viaje con nosotros</p>
                <button className={styles.ghost} onClick={() => setView("regAlumno")}>
                  Registrarse como Alumno
                </button>
                <button className={styles.ghost} onClick={() => setView("regProfesor")}>
                  Registrarse como Profesor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;
