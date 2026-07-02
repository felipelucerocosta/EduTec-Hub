import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components reutilizables/header";
import Card from "../components reutilizables/Card";
import Button from "../components reutilizables/Button";
import styles from "../Home.module.css";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectLevel = (level: string) => {
    navigate(`/registro?nivel=${level}`);
  };

  const features = [
    {
      icon: "bx-calendar-check",
      title: "Calendario Integrado",
      desc: "Organiza entregas, exámenes y eventos escolares con el calendario personalizado sincronizado en tiempo real.",
    },
    {
      icon: "bx-task",
      title: "Gestión Escolar",
      desc: "Envía tareas, realiza el seguimiento de calificaciones y mantén el calendario de clases siempre ordenado.",
    },
    {
      icon: "bx-conversation",
      title: "Canal de Consultas",
      desc: "Comunícate directamente con tus profesores y colabora con compañeros a través de los foros integrados.",
    },
  ];

  const levels = [
    {
      title: "Nivel Inicial",
      description: "Jardín maternal y jardín de infantes. Primeras experiencias educativas formativas para el desarrollo integral del niño.",
      icon: "bx-smile",
      tag: "Sala de 3, 4 y 5 años",
      level: "inicial",
    },
    {
      title: "Nivel Primario",
      description: "Educación primaria de 1° a 6° grado. Formación en las bases del conocimiento: lectura, escritura, matemática y ciencias.",
      icon: "bx-book-open",
      tag: "1° a 6° Grado",
      level: "primario",
    },
    {
      title: "Nivel Secundario",
      description: "Educación secundaria de 1° a 6° año. Formación académica y técnica con orientaciones para el mundo laboral y superior.",
      icon: "bx-graduation",
      tag: "1° a 6° Año",
      level: "secundario",
    },
    {
      title: "Nivel Terciario",
      description: "Institutos de Formación Docente y Técnica Superior. Carreras de especialización y profesionalización en diversas áreas.",
      icon: "bx-trophy",
      tag: "Formación Superior",
      level: "terciario",
    },
  ];

  return (
    <div className={styles.homeBody}>
      <div className={styles.homeBackground} />
      <Header showLogout={false} />

      <main className={styles.homeContent}>
        {/* ── Hero ── */}
        <section className={styles.heroSection}>
          <div className={styles.heroBadge}>
            <i className="bx bx-bolt-circle"></i>
            Plataforma Educativa Técnica
          </div>
          <h1 className={styles.title}>Edutech</h1>
          <p className={styles.subtitle}>
            La plataforma de educación técnica integrada. Accede a tus aulas virtuales,
            gestiona tu cursado y potencia tu aprendizaje tecnológico.
          </p>
        </section>

        {/* ── Selector de Nivel ── */}
        <section>
          <h2 className={styles.levelSelectorTitle}>
            Selecciona tu <span>Nivel Educativo</span>
          </h2>

          <div className={styles.cardsGrid}>
            {levels.map((item) => (
              <Card
                key={item.level}
                title={item.title}
                description={item.description}
                icon={item.icon}
                onClick={() => handleSelectLevel(item.level)}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#38bdf8", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <i className="bx bx-check-double"></i> {item.tag}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className={styles.featuresSection}>
          <h2 className={styles.featuresTitle}>¿Qué ofrece Edutech?</h2>
          <p className={styles.featuresSubtitle}>Herramientas diseñadas para potenciar tu experiencia educativa.</p>

          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <i className={`bx ${f.icon}`}></i>
                </div>
                <h3 className={styles.featureItemTitle}>{f.title}</h3>
                <p className={styles.featureItemDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <div className={styles.quickActions}>
          <Button onClick={() => navigate("/registro")} icon="bx-log-in">
            Iniciar Sesión
          </Button>
          <Button variant="outline" onClick={() => navigate("/registro?action=register")} icon="bx-user-plus">
            Crear Cuenta
          </Button>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Edutech &copy; {new Date().getFullYear()}</p>
        <p style={{ marginTop: "0.25rem" }}>
          Diseñado por los alumnos de la Escuela de Educación Secundaria Técnica N° 29 D.E. 6
        </p>
      </footer>
    </div>
  );
};

export default Home;
