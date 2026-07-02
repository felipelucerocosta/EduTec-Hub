import React from "react";
import { useNavigate } from "react-router-dom";
import Clases from "./clases";
import Header from "../components reutilizables/header";
import Button from "../components reutilizables/Button";
import styles from "../Registro.module.css";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.loginRegisterBody} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header showLogout={true} />
      
      <div className={styles.loginRegisterContainer} style={{ flex: "0 0 auto", padding: "2.5rem 1rem 1rem" }}>
        <div className={styles.containerPrincipal} style={{ width: "min(520px, calc(100vw - 2rem))", textAlign: "center" }}>
          
          <div className={styles.formHeader} style={{ marginBottom: "1.5rem" }}>
            <div className={styles.formLogoMark} style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 0 24px rgba(245, 158, 11, 0.4)" }}>
              <i className="bx bx-shield-quarter"></i>
            </div>
            <h1 className={styles.formTitle} style={{ fontSize: "1.5rem" }}>Panel de Administración</h1>
            <p className={styles.formSubtitle} style={{ color: "#a78bfa", fontWeight: 600, marginTop: "0.25rem" }}>
              Rol: Super Administrador
            </p>
          </div>

          <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Esta vista de administrador tiene acceso total a la gestión de todas las comisiones, 
            materias y solicitudes de permisos en el campus virtual.
          </p>

          <Button variant="outline" onClick={() => navigate("/")} icon="bx-log-out" style={{ width: "100%" }}>
            Volver al inicio
          </Button>

        </div>
      </div>

      <div style={{ flex: "1 1 auto", width: "100%", position: "relative" }}>
        <Clases />
      </div>
    </div>
  );
};

export default AdminDashboard;
