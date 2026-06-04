import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components reutilizables/header";
import Card from "../components reutilizables/Card";
import Button from "../components reutilizables/Button";
import styles from "../Home.module.css";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectLevel = (level: string) => {
    // Redirige al registro/login pasando el nivel seleccionado por URL
    navigate(`/registro?nivel=${level}`);
  };

  return (
    <div className={styles.homeBody}>
      <div className={styles.homeBackground} />
      
      {/* Header unificado sin links de navegación y sin botón de logout */}
      <Header showLogout={false} />

      <main className={styles.homeContent}>
        <section className={styles.heroSection}>
          <h2 className={styles.title}>Edu-Tech</h2>
          <p className={styles.subtitle}>
            La plataforma de educación técnica integrada. Accede a tus aulas virtuales,
            gestiona tu cursado y potencia tu aprendizaje tecnológico.
          </p>
        </section>

        <section>
          <h3 className={styles.levelSelectorTitle}>Selecciona tu Nivel Educativo</h3>
          
          <div className={styles.cardsGrid}>
            <Card
              title="Nivel Inicial"
              description="Jardín maternal y jardín de infantes. Primeras experiencias educativas formativas para el desarrollo integral del niño en sus etapas más tempranas."
              icon="bx-smile"
              onClick={() => handleSelectLevel("inicial")}
            >
              <div style={{ marginTop: "1rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#a78bfa", fontWeight: 600 }}>
                  <i className="bx bx-check-double"></i> Sala de 3, 4 y 5 años
                </span>
              </div>
            </Card>

            <Card
              title="Nivel Primario"
              description="Educación primaria de 1° a 6° grado. Formación en las bases del conocimiento: lectura, escritura, matemática y ciencias sociales y naturales."
              icon="bx-book-open"
              onClick={() => handleSelectLevel("primario")}
            >
              <div style={{ marginTop: "1rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#a78bfa", fontWeight: 600 }}>
                  <i className="bx bx-check-double"></i> 1° a 6° Grado
                </span>
              </div>
            </Card>

            <Card
              title="Nivel Secundario"
              description="Educación secundaria de 1° a 6° año. Formación académica y técnica con orientaciones específicas que preparan para el mundo del trabajo y estudios superiores."
              icon="bx-graduation"
              onClick={() => handleSelectLevel("secundario")}
            >
              <div style={{ marginTop: "1rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#a78bfa", fontWeight: 600 }}>
                  <i className="bx bx-check-double"></i> 1° a 6° Año
                </span>
              </div>
            </Card>
            <Card
              title="Nivel Terciario"
              description="Institutos de Formación Docente y Técnica Superior. Carreras de dos a cuatro años para la especialización y profesionalización en diversas áreas."
              icon="bx-trophy"
              onClick={() => handleSelectLevel("terciario")}
            >
              <div style={{ marginTop: "1rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#a78bfa", fontWeight: 600 }}>
                  <i className="bx bx-check-double"></i> Formación Superior
                </span>
              </div>
            </Card>
          </div>
        </section>

        {/* Sección de características premium de la plataforma */}
        <section className={styles.featuresSection}>
          <h3 className={styles.featuresTitle}>¿Qué ofrece EduTec-Hub?</h3>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <i className="bx bx-calendar-check"></i>
              </div>
              <h4 className={styles.featureItemTitle}>Calendario Integrado</h4>
              <p className={styles.featureItemDesc}>
                Organiza tus entregas, fechas de exámenes y eventos escolares con el
                calendario personalizado sincronizado con el servidor.
              </p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <i className="bx bx-task"></i>
              </div>
              <h4 className={styles.featureItemTitle}>Gestión Escolar</h4>
              <p className={styles.featureItemDesc}>
                Envía tus tareas, realiza el seguimiento de tus calificaciones y mantén el calendario
                de clases organizado.
              </p>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <i className="bx bx-conversation"></i>
              </div>
              <h4 className={styles.featureItemTitle}>Canal de Consultas</h4>
              <p className={styles.featureItemDesc}>
                Comunícate de manera directa con tus profesores y colabora con tus compañeros a través
                de los foros integrados.
              </p>
            </div>
          </div>
        </section>

        
      </main>

      <footer className={styles.footer}>
        <p>EduTech &copy; {new Date().getFullYear()}</p>
        <p style={{ marginTop: "0.25rem", fontSize: "0.75rem" }}>
          Diseñado por los alumno de la Escuela de Educación Secundaria Técnica N° 29 D.E. 6
        </p>
      </footer>
    </div>
  );
};

export default Home;
