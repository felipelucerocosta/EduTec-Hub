---
version: 2
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets:
  - "frontend/src/components/layout/AppLayout.tsx"
  - "frontend/src/components/layout/Sidebar.tsx"
  - "frontend/src/pages/Dashboard.tsx"
  - "frontend/src/pages/Boletin.tsx"
  - "frontend/src/pages/Rendimiento.tsx"
  - "frontend/src/componentes/Alfred.tsx"
---

## Scope

Nueva dirección de experiencia de usuario e interfaz para TECH-ROOM 29 / EduTech. Rediseño del shell de aplicación (`App.tsx`, `AppLayout`, `Sidebar`), consola de navegación unificada, analíticas de rendimiento académico basadas en dashboard y optimización de flujos diferenciados para Alumnos, Profesores y Administradores. Modo: Operate.

## Visitor

Alumnos, profesores y directivos de instituciones educativas (inicial a terciario). Vienen a consultar rendimiento, corregir y entregar trabajos, revisar el boletín y supervisar divisiones. Buscan agilidad, cero fricción cognitiva, información visual jerarquizada y precisión analítica.

## Chosen direction

**Digital Campus Matrix (Consola Académica Tecnológica Contemporánea)** — Minimalismo tecnológico de precisión con diseño editorial de alto nivel. Fondo pizarra profunda (#0a0e17 / #0f172a), arquitectura de tarjetas estructuradas por micro-bordes de 1px, tipografía geométrica nítida (Outfit + Plus Jakarta Sans), gráficos analíticos continuos (curvas de rendimiento, aros de avance, barras de actividad) y acentos controlados en Violeta Tecnológico (#7c3aed) y Azul Eléctrico (#38bdf8). Shell con Sidebar tipo Rail colapsable, Command Palette global y asistente Alfred desacoplable en drawer lateral.

## Direction contract

THESIS: TECH-ROOM 29 opera como una consola de gestión educativa inteligente. Rechaza tanto el LMS genérico y aburrido como el software gamer sobrecargado de luces RGB: ofrece la seriedad de una plataforma analítica institucional moderna con la elegancia de un sistema operativo de ingeniería.

OWN-WORLD: Fondo base #0a0e17 con tarjetas en #0f172a / rgba(18, 24, 38, 0.7) delimitadas por bordes finos de 1px rgba(255, 255, 255, 0.08). Gráficos SVG interactivos fluidos con gradientes suaves en violeta y azul eléctrico. Tipografía Outfit para cifras y titulares; Plus Jakarta Sans para metadatos y lectura.

STORY: El usuario ingresa a una consola unificada. El encabezado superior integra Command Palette (Ctrl+K), acceso a perfil y notificaciones. El cuerpo presenta una grilla analítica: fila superior de métricas KPI con curvas de tendencia, panel central de rendimiento académico y avance del curso, y bloques secundarios para actividades y agenda. Alfred se despliega como un drawer lateral sin tapar el espacio de trabajo.

FIRST VIEWPORT: Barra lateral izquierda (Rail 72px / expandible a 240px) + Topbar con buscador instantáneo + Grilla analítica principal inspirada en centro de control con widgets KPI, gráfico de doble curva de evolución temporal, gráfico circular de distribución de tareas y tabla de estado por materias/divisiones.
