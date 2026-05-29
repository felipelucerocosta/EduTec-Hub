import React from "react";
import { useNavigate } from "react-router-dom";
import Clases from "./clases";
import styles from "../Registro.module.css";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.loginRegisterBody}>
      <div className={styles.loginRegisterContainer}>
        <div className={styles.containerPrincipal} style={{ padding: "20px 30px" }}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#000", marginBottom: "8px" }}>
              ADMIN DASHBOARD
            </div>
            <div style={{ background: "#000", color: "#fff", display: "inline-block", padding: "8px 18px", borderRadius: "999px", marginBottom: "12px" }}>
              Vista Administrador
            </div>
            <p style={{ color: "#333", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
              Esta vista tiene acceso completo a las clases del sistema y a todas las herramientas de gestión que ve un profesor.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              marginTop: "17px",
              background: "#000",
              color: "#fff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "999px",
              cursor: "pointer"
            }}
          >
            Volver al login
          </button>
        </div>
      </div>
      <div style={{ width: "100%" }}>
        <Clases />
      </div>
    </div>
  );
};

export default AdminDashboard;
