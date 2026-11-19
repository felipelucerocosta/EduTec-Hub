import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components reutilizables/header";
import KnowledgePlanet from "../components/3d/KnowledgePlanet";
import techConceptUrl from "../assets/illustrations/tech_education_concept.jpg";
import styles from "../Home.module.css";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);

  const handleSelectLevel = (level: string) => {
    navigate(`/registro?nivel=${level}`);
  };

  return (
    <div className={styles.homeBody}>
      {/* ── Entorno Espacial Multicapa con Nebulosa IA ── */}
      <div className={styles.spaceNebulaBackdrop} />
      <div className={styles.spaceNebulaTop} />
      <div className={styles.spaceNebulaBottom} />
      <div className={styles.spaceGridLines} />

      <Header showLogout={false} />

      <main className={styles.homeContent}>
        {/* ── Hero Stage: Ecosistema Espacial & Planeta del Conocimiento ── */}
        <section className={styles.heroStage}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.pulseDot} />
              Ecosistema Académico EduTech
            </div>

            <h1 className={styles.heroTitle}>
              EduTech
            </h1>

            <p className={styles.heroLead}>
              Entorno inteligente de aprendizaje donde convergen la ciencia, la infraestructura de redes y la formación técnica especializada. Arquitectura concebida para la gestión integral de trayectorias escolares desde nivel inicial hasta educación superior.
            </p>

            <div className={styles.heroActions}>
              <button
                className={styles.btnPrimaryGlow}
                onClick={() => navigate("/registro")}
              >
                <i className="bx bx-log-in" style={{ fontSize: "1.2rem" }}></i>
                Ingresar a la Plataforma
              </button>
              <button
                className={styles.btnSecondaryGlass}
                onClick={() => navigate("/registro?action=register")}
              >
                <i className="bx bx-user-plus" style={{ fontSize: "1.2rem" }}></i>
                Registrar Matrícula
              </button>
            </div>

            {/* Micro-telemetría de estado del campus */}
            <div className={styles.telemetryBar}>
              <div className={styles.telemetryMetric}>
                <span className={styles.telemetryVal}>100%</span>
                <span className={styles.telemetrySub}>Aislamiento de Cursos</span>
              </div>
              <div className={styles.telemetryMetric}>
                <span className={styles.telemetryVal}>3D</span>
                <span className={styles.telemetrySub}>Red de Telemetría</span>
              </div>
              <div className={styles.telemetryMetric}>
                <span className={styles.telemetryVal}>RBAC</span>
                <span className={styles.telemetrySub}>Control por Roles</span>
              </div>
            </div>
          </div>

          {/* Planeta 3D del Conocimiento en su viewport volumétrico */}
          <div className={styles.heroPlanetViewport}>
            <div className={styles.heroPlanetHalo} />
            <KnowledgePlanet
              size={540}
              interactive={true}
              activeLevel={hoveredLevel || undefined}
              onSelectNode={(nodeName) => {
                console.log("Nodo interactuado:", nodeName);
              }}
            />
          </div>
        </section>

        {/* ── Matriz Asimétrica de Niveles Educativos ── */}
        <section>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <h2 className={styles.sectionTitle}>
                Trayectorias Educativas
              </h2>
              <p className={styles.sectionSubtitle}>
                Selecciona tu ciclo formativo para acceder a aulas, talleres de especialidad y actas académicas
              </p>
            </div>
          </div>

          <div className={styles.levelRail}>
            {/* 1. Nivel Inicial */}
            <div
              className={`${styles.levelNodeCard} ${styles.levelCardInicial}`}
              onClick={() => handleSelectLevel("inicial")}
              onMouseEnter={() => setHoveredLevel("inicial")}
              onMouseLeave={() => setHoveredLevel(null)}
            >
              <div>
                <div className={styles.levelNodeHeader}>
                  <div
                    className={styles.levelNodeIcon}
                    style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}
                  >
                    <i className="bx bx-smile"></i>
                  </div>
                  <span
                    className={styles.levelTag}
                    style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}
                  >
                    Salas de 3, 4 y 5
                  </span>
                </div>
                <h3 className={styles.levelNodeTitle}>Nivel Inicial</h3>
                <p className={styles.levelNodeDesc}>
                  Jardín maternal e infantes. Estimulación sensorial temprana, primeras nociones del entorno y alfabetización lúdica guiada.
                </p>
              </div>

              <div className={styles.levelNodeAction} style={{ color: "#38bdf8" }}>
                <span>Ingresar al ciclo inicial</span>
                <i className="bx bx-right-arrow-alt" style={{ fontSize: "1.2rem" }}></i>
              </div>
            </div>

            {/* 2. Nivel Primario */}
            <div
              className={`${styles.levelNodeCard} ${styles.levelCardPrimario}`}
              onClick={() => handleSelectLevel("primario")}
              onMouseEnter={() => setHoveredLevel("primario")}
              onMouseLeave={() => setHoveredLevel(null)}
            >
              <div>
                <div className={styles.levelNodeHeader}>
                  <div
                    className={styles.levelNodeIcon}
                    style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
                  >
                    <i className="bx bx-book-open"></i>
                  </div>
                  <span
                    className={styles.levelTag}
                    style={{ background: "rgba(16, 185, 129, 0.12)", color: "#34d399" }}
                  >
                    1° a 6° Grado
                  </span>
                </div>
                <h3 className={styles.levelNodeTitle}>Nivel Primario</h3>
                <p className={styles.levelNodeDesc}>
                  Pensamiento lógico, ciencias exactas, expresión y primeras prácticas digitales en laboratorio estructurado.
                </p>
              </div>

              <div className={styles.levelNodeAction} style={{ color: "#34d399" }}>
                <span>Ingresar al ciclo primario</span>
                <i className="bx bx-right-arrow-alt" style={{ fontSize: "1.2rem" }}></i>
              </div>
            </div>

            {/* 3. Nivel Secundario Técnico (E.E.S.T. N° 29 - Card Principal) */}
            <div
              className={`${styles.levelNodeCard} ${styles.levelCardSecundario}`}
              onClick={() => handleSelectLevel("secundario")}
              onMouseEnter={() => setHoveredLevel("secundario")}
              onMouseLeave={() => setHoveredLevel(null)}
            >
              <div>
                <div className={styles.levelNodeHeader}>
                  <div
                    className={styles.levelNodeIcon}
                    style={{ background: "rgba(124, 58, 237, 0.25)", color: "#c4b5fd" }}
                  >
                    <i className="bx bx-chip"></i>
                  </div>
                
                </div>
                <h3 className={styles.levelNodeTitle} style={{ fontSize: "1.5rem" }}>
                  Nivel Secundario Técnico
                </h3>
                <p className={styles.levelNodeDesc} style={{ maxWidth: "520px" }}>
                  Ciclo Básico y Formación Técnico-Profesional. Talleres especializados en computación, robótica, circuitos electrónicos integrados, desarrollo de software y administración de redes de telecomunicaciones.
                </p>
              </div>

              <div className={styles.levelNodeAction} style={{ color: "#c4b5fd", marginTop: "1.8rem" }}>
                <span>Acceder a talleres técnicos y divisiones</span>
                <i className="bx bx-right-arrow-alt" style={{ fontSize: "1.3rem" }}></i>
              </div>
            </div>

            {/* 4. Nivel Terciario & Superior (Fila Panorámica) */}
            <div
              className={`${styles.levelNodeCard} ${styles.levelCardTerciario}`}
              onClick={() => handleSelectLevel("terciario")}
              onMouseEnter={() => setHoveredLevel("terciario")}
              onMouseLeave={() => setHoveredLevel(null)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  className={styles.levelNodeIcon}
                  style={{ background: "rgba(99, 102, 241, 0.18)", color: "#818cf8" }}
                >
                  <i className="bx bx-certification"></i>
                </div>
                <div>
                  <h3 className={styles.levelNodeTitle} style={{ margin: 0 }}>
                    Nivel Terciario & Superior
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>
                    Tecnicaturas Superiores e I+D
                  </span>
                </div>
              </div>

              <div>
                <p className={styles.levelNodeDesc}>
                  Carreras superiores de desarrollo de software empresarial, automatización industrial, análisis de datos y proyectos de ingeniería aplicada.
                </p>
              </div>

              <div className={styles.levelNodeAction} style={{ color: "#818cf8", margin: 0 }}>
                <span>Ingresar a nivel superior</span>
                <i className="bx bx-right-arrow-alt" style={{ fontSize: "1.2rem" }}></i>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pilares de Arquitectura Tecnológica ── */}
        <section>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <h2 className={styles.sectionTitle}>
                Pilares del Ecosistema Institucional
              </h2>
              <p className={styles.sectionSubtitle}>
                Diseño de software con rigor académico para instituciones educativas de alta demanda
              </p>
            </div>
          </div>

          <div className={styles.pillarsStage}>
            {/* Panel Principal: Aislamiento divisional */}
            <div className={styles.pillarHeroPanel}>
              <div>
                <h3 className={styles.pillarHeroTitle}>
                  Aislamiento Hermético de Cursos y Materias
                </h3>
                <p className={styles.pillarHeroDesc}>
                  Cada comisión y división escolar funciona en un contexto aislado. Los docentes gestionan exclusivamente sus materias asignadas y los estudiantes acceden únicamente a los trabajos, materiales y foros de su cohorte oficial.
                </p>
                <img
                  src={techConceptUrl}
                  alt="Arquitectura de red académica E.E.S.T. 29"
                  className={styles.pillarConceptImage}
                />
              </div>

              {/* Esquema visual de la matriz divisional */}
              <div className={styles.isolationMatrixMock}>
                <div className={styles.divisionCell}>
                  <span className={styles.divisionCode}>3° 1° Computación</span>
                  <span className={styles.divisionStatus}>
                    <i className="bx bx-check-shield"></i> Aislado & Activo
                  </span>
                </div>
                <div className={styles.divisionCell}>
                  <span className={styles.divisionCode}>4° 2° Electrónica</span>
                  <span className={styles.divisionStatus}>
                    <i className="bx bx-check-shield"></i> Aislado & Activo
                  </span>
                </div>
                <div className={styles.divisionCell}>
                  <span className={styles.divisionCode}>5° 1° Robótica</span>
                  <span className={styles.divisionStatus}>
                    <i className="bx bx-check-shield"></i> Aislado & Activo
                  </span>
                </div>
              </div>
            </div>

            {/* Side Stack: Telemetría y Alfred */}
            <div className={styles.pillarsSideStack}>
              <div className={styles.pillarCardRefined}>
                <div
                  className={styles.pillarIconBox}
                  style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}
                >
                  <i className="bx bx-line-chart"></i>
                </div>
                <div>
                  <h4 className={styles.pillarCardTitle}>Telemetría y Boletines Oficiales</h4>
                  <p className={styles.pillarCardText}>
                    Cálculo automatizado de promedios ponderados por trimestre, seguimiento de entregas en tiempo real y cierre de actas escolares normadas.
                  </p>
                </div>
              </div>

              <div className={styles.pillarCardRefined}>
                <div
                  className={styles.pillarIconBox}
                  style={{ background: "rgba(124, 58, 237, 0.15)", color: "#c4b5fd" }}
                >
                  <i className="bx bx-bot"></i>
                </div>
                <div>
                  <h4 className={styles.pillarCardTitle}>Asistente Institucional Alfred</h4>
                  <p className={styles.pillarCardText}>
                    Asistencia técnica contextual disponible las 24 horas para resolución de dudas operativas y validación pedagógica segura.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer Institucional ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.25rem" }}>
              <img
                src="/emblema-edge.png"
                alt="EduTech — Emblema Edge"
                style={{ width: "26px", height: "26px", objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(121, 41, 210, 0.4))" }}
              />
              <span className={styles.footerTitle} style={{ margin: 0 }}>EduTech</span>
            </div>
            <span className={styles.footerDesc}>
              Escuela de Educación Secundaria Técnica N° 29 D.E. 6 "Reconquista de Buenos Aires"
            </span>
          </div>

          <span className={styles.footerLegal}>
            &copy; {new Date().getFullYear()} EduTech · Todos los derechos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
