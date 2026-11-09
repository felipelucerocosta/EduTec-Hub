---
name: TECH-ROOM 29 / EduTech
description: Sistema de diseño tecnológico-académico para gestión educativa integral
colors:
  primary: "#7c3aed"
  primary-hover: "#6d28d9"
  primary-light: "rgba(124, 58, 237, 0.15)"
  primary-glow: "rgba(124, 58, 237, 0.35)"
  secondary: "#38bdf8"
  secondary-hover: "#0284c7"
  secondary-light: "rgba(56, 189, 248, 0.15)"
  accent-cyan: "#06b6d4"
  accent-indigo: "#4f46e5"
  accent-emerald: "#10b981"
  accent-amber: "#f59e0b"
  accent-rose: "#f43f5e"
  canvas-dark: "#030014"
  canvas-surface: "#090d16"
  surface-card: "rgba(18, 24, 38, 0.7)"
  surface-card-hover: "rgba(26, 35, 54, 0.85)"
  surface-glass-modal: "rgba(13, 9, 39, 0.95)"
  surface-sidebar: "rgba(15, 23, 42, 0.95)"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  border-hover: "rgba(124, 58, 237, 0.4)"
  text-primary: "#f8fafc"
  text-secondary: "#94a3b8"
  text-muted: "#64748b"
typography:
  display:
    fontFamily: "Outfit, Sora, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Outfit, Sora, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sora, Outfit, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Sora, -apple-system, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "Sora, -apple-system, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "#a78bfa"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
---

# Design System: TECH-ROOM 29 / EduTech

## Overview

**Creative North Star: "The Digital Campus Matrix" (La Matriz del Campus Digital)**

El sistema visual de TECH-ROOM 29 / EduTech materializa la intersección entre infraestructura tecnológica de vanguardia, rigor académico institucional y confiabilidad operativa de nivel profesional. Diseñado para dar soporte a instituciones de todos los niveles educativos (desde Inicial hasta Terciario), el entorno visual rechaza tanto la frialdad corporativa plana como el diseño informal de consumo, articulando una atmósfera de sala técnica de operaciones académicas.

La interfaz se estructura sobre una base tonal oscura profunda inspirada en centros de control e infraestructura de telecomunicaciones (`#030014` y `#090d16`), enriquecida mediante superficies translúcidas (*glassmorphism* controlado con `backdrop-filter: blur(12px-20px)`), trazos de borde luminiscentes milimétricos (1px) y una firma cromática dual: **Violeta Tecnológico** (`#7c3aed`) como ancla de identidad e innovación de sistemas, y **Azul Eléctrico / Sky** (`#38bdf8`) como vector de interacción y dinamismo cibernético.

La densidad es deliberada: alta legibilidad de datos, micro-etiquetado en mayúsculas espaciadas (`0.75rem`, `letter-spacing: 0.04em`), tarjetas con respuesta háptica visual al cursor (`transform: translateY(-4px)` y resplandor difuso) y componentes modulares que transmiten orden analítico y precisión de laboratorio.

**Key Characteristics:**
- **Atmósfera Glassmórfica Oscura:** Lienzo de baja luminosidad con paneles vidriados semitransparentes y velos de gradiente radial ambiental.
- **Acento Tecnológico Bicolor:** Gradiente y contraste complementario entre violeta `#7c3aed`, azul índigo `#4f46e5` y azul eléctrico `#38bdf8`.
- **Estructura Analítica de Datos:** Visualizaciones de métricas con micrográficos SVG responsivos, tablas de bordes etéreos y tarjetas de resumen KPI.
- **Jerarquía Tipográfica Moderna:** Coexistencia de tipografías geométricas contemporáneas con pesos contrastados (desde Ultra-bold 800 para números hasta Regular 400 para textos explicativos).
- **Semántica de Estado Rápida:** Código de color unificado para alertas, aprobaciones y vencimientos (Verde Esmeralda, Ámbar de advertencia, Rosa/Rojo de error).

---

## Colors

El sistema cromático implementa un equilibrio entre una base espacial neutra profunda y un esquema de acentos tecnológicos de alta fidelidad, evitando la saturación indiscriminada mediante el confinamiento de los colores vivos a botones primarios, indicadores de estado, bordes activos y halos de elevación.

### Primary
- **Tech Violet** (`#7c3aed` / `oklch(56% 0.24 293)`): Color de identidad principal. Utilizado en acciones primarias, botones principales, insignias de marca, iconos destacados y efectos de resplandor.
- **Tech Violet Hover** (`#6d28d9`): Estado interactivo de hover en botones primarios y selección activa.
- **Tech Violet Glow** (`rgba(124, 58, 237, 0.35)`): Halo difuso de iluminación ambiental y sombra proyectada en elementos de primer nivel.
- **Tech Violet Subdued** (`rgba(124, 58, 237, 0.15)`): Relleno de fondo para insignias, píldoras y contenedores de iconos secundarios.

### Secondary
- **Electric Blue / Sky** (`#38bdf8` / `oklch(76% 0.14 220)`): Vector de interacción, enlaces activos, acento de gráficos, estadísticas destacadas y puntos de datos en curvas de evolución.
- **Deep Electric Blue** (`#0284c7`): Variante para hover de hipervínculos y estados enfocados en componentes secundarios.
- **Cyan Cyber** (`#06b6d4`): Matiz complementario presente en gradientes de cabeceras, tarjetas interactivas y en el widget institucional de Alfred (`linear-gradient(135deg, #7c3aed, #06b6d4)`).

### Tertiary & Semantic Accents
- **Emerald Academic Success** (`#10b981` / fondo `rgba(16, 185, 129, 0.15)` / texto `#34d399`): Estado de materias aprobadas, notas excelentes (7 a 10), confirmaciones y trabajos calificados en tiempo y forma.
- **Amber Caution** (`#f59e0b` / fondo `rgba(245, 158, 11, 0.15)` / texto `#fbbf24`): Tareas pendientes próximas a vencer, regularidades, avisos preventivos y estados intermedios.
- **Rose Error & Alert** (`#f43f5e` / `#dc2626` / fondo `rgba(244, 63, 94, 0.15)` / texto `#fb7185`): Tareas vencidas, errores de validación de formularios, desaprobaciones y acciones destructivas de administración.

### Neutral & Surfaces
- **Obsidian Deep Canvas** (`#030014` / `#090d16`): Fondo maestro de la aplicación web y páginas de bienvenida / autenticación.
- **Deep Slate Surface** (`#0f172a` / `rgba(15, 23, 42, 0.95)`): Fondo de barra lateral de navegación, contenedores de tablas y paneles de control.
- **Glass Card Background** (`rgba(255, 255, 255, 0.04)` / `rgba(18, 24, 38, 0.7)`): Superficie de tarjetas con `backdrop-filter: blur(12px)`.
- **Glass Modal Backdrop** (`rgba(13, 9, 39, 0.95)`): Fondo enriquecido para diálogos modales y ventana de chat del asistente.
- **Border Ethereal Line** (`rgba(255, 255, 255, 0.08)`): Delimitador estructural de tarjetas, encabezados y divisiones de fila.
- **Text Main Slate 50** (`#f8fafc` / `#f1f5f9`): Títulos, encabezados, cifras métricas y texto principal.
- **Text Secondary Slate 400** (`#94a3b8`): Subtítulos, descripciones secundarias, etiquetas de formulario y leyendas.
- **Text Muted Slate 500** (`#64748b`): Metadatos terciarios, marcas temporales y estados desactivados.

### Named Rules
**The Luminescence Control Rule.** Los fondos luminosos o colores saturados al 100% nunca deben cubrir más del 8% de la superficie visible. El violeta y el azul actúan como haces de luz sobre la base oscura, nunca como fondos sólidos masivos de página.

**The Semantic Badge Rule.** Ningún estado semántico (Aprobado, Pendiente, Vencido) se representa únicamente con color plano; siempre debe combinar un borde tenue (30% opacidad), un fondo con baja opacidad (12-15%) y una etiqueta de texto explícita o icono inequívoco.

---

## Typography

El sistema tipográfico comunica claridad técnica e institucional. Se apoya en tipos de palo seco geométricos con apertura generosa, cifras tabulares legibles y jerarquía estricta.

**Display Font:** `Outfit`, con fallback `'Plus Jakarta Sans', -apple-system, sans-serif`  
**Body Font:** `'Plus Jakarta Sans'`, con fallback `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`  
**Mono / Numeric Font:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` (para códigos de invitación `MAT-31-01` y tokens de verificación)

**Character:** Elegancia geométrica contemporánea con precisión de ingeniería. La combinación proyecta autoridad académica y fluidez digital moderna.

### Hierarchy
- **Display** (800 ExtraBold, `clamp(2.5rem, 6vw, 4.5rem)`, line-height 1.1, letter-spacing `-0.03em`): Títulos de portada, landing institucional y hero banners con gradiente de texto animado (`linear-gradient(135deg, #e2d9f3 0%, #a78bfa 35%, #38bdf8 70%)`).
- **Headline / Page Title** (800 ExtraBold, `1.75rem` - `1.8rem` / 28px, line-height 1.25, letter-spacing `-0.02em`): Encabezados principales de página en Dashboard, Boletín, Clases y Paneles.
- **Title / Section Header** (700 Bold, `1.15rem` - `1.25rem` / 20px, line-height 1.35, letter-spacing `-0.01em`): Títulos de tarjetas, cabeceras de modales y nombres de materia.
- **Body Regular** (400 Regular / 500 Medium, `0.9rem` - `0.95rem` / 15px, line-height 1.55, letter-spacing `0em`): Descripciones de tareas, consignas de trabajos prácticos y mensajes del foro. Longitud máxima recomendada: 65–75 caracteres.
- **Label / Metadata** (600 SemiBold, `0.75rem` - `0.85rem` / 12-13px, letter-spacing `0.04em`, uppercase selectivo): Badges de división, roles de usuario, encabezados de columnas de tablas y etiquetas de campos de formulario.

### Named Rules
**The Single Scale Rule.** Los tamaños de texto no deben definirse arbitrariamente con píxeles dispersos; deben adherirse estrictamente a la escala: `0.75rem` (12px), `0.85rem` (13.6px), `0.95rem` (15.2px), `1.15rem` (18.4px), `1.75rem` (28px), `2.25rem` (36px).

---

## Layout

El layout responde a una arquitectura híbrida: un contenedor exterior con navegación persistente en barra lateral y un área de trabajo central contenida y ergonómica.

### Spatial Model & Breakpoints
- **Mobile (`< 768px`):** Barra lateral retraída a menú flotante inferior activable mediante botón redondo (`48px x 48px`, `background: var(--primary)`). Padding de contenido reducido a `16px`. Las tablas activan scroll horizontal autónomo.
- **Tablet (`768px - 1024px`):** Barra lateral en modo colapsado (`80px`), mostrando únicamente la iconografía de sección. Contenedor principal adaptable con espaciado interno de `20px`.
- **Desktop (`> 1024px`):** Barra lateral expandida (`260px`) con navegación completa por texto e iconos. Contenedor central acotado a un ancho máximo de `1280px` (o `1200px` en páginas de catálogo de clases), centrado horizontalmente (`margin: 0 auto`) con relleno de `24px`.

### Spacing Scale
- `xs` (4px): Espaciado entre iconos y etiquetas de badges.
- `sm` (8px): Distancia entre campos contiguos e items de lista compacta.
- `md` (16px): Padding estándar de tarjetas de datos y filas de tablas.
- `lg` (24px): Padding general de páginas de administración y separación de bloques de tarjetas.
- `xl` (32px): Separación vertical entre el banner de bienvenida y la grilla de contenido.
- `2xl` (48px - 64px): Separación entre secciones mayores en landing pages.

---

## Elevation & Depth

La tridimensionalidad en TECH-ROOM 29 no se construye con sombras opacas tradicionales de software de oficina, sino mediante **superficies refractarias y gradientes lumínicos de fondo**.

### Shadow Vocabulary
- **Subtle Surface Lift** (`box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2)`): Elevación en reposo para tarjetas informativas y badges.
- **Elevated Card & Toast** (`box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35)`): Aplicado a toasts de notificación, barras flotantes y tarjetas de clases en reposo.
- **Active Hover Glow** (`box-shadow: 0 12px 36px rgba(124, 58, 237, 0.18), 0 4px 12px rgba(0, 0, 0, 0.3)`): Respuesta interactiva al posar el cursor sobre tarjetas cliqueables y botones primarios.
- **Deep Modal Shadow** (`box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(124, 58, 237, 0.1)`): Aplicado a ventanas modales y al contenedor del asistente virtual Alfred.

### Named Rules
**The Glass Border Fallback.** Toda superficie flotante o semitransparente (`backdrop-filter`) debe poseer obligatoriamente un borde físico continuo de 1px con opacidad reducida (`rgba(255, 255, 255, 0.08)` o `rgba(124, 58, 237, 0.2)`). En monitores de bajo ángulo de visión o baja resolución, el borde garantiza el corte de figura sin depender exclusivamente del desenfoque.

---

## Shapes

El lenguaje de formas combina aristas suavizadas ergonómicas con geometrías rectilíneas estables.

- **Contenedores Mayores (Modales, Banners Hero):** Radio de curvatura amplio (`20px`). Suaviza la intrusión visual en pantalla completa.
- **Tarjetas y Paneles (Cards, Summary Boxes):** Radio medio-grande (`16px` a `18px`). Crea una silueta moderna y amigable.
- **Contenedores de Tarea y Filas de Lista:** Radio medio (`12px` a `14px`). Ideal para elementos que se apilan verticalmente con separación de 8–12px.
- **Botones y Campos de Entrada:** Radio estándar (`10px`). Asegura un clic táctil firme sin llegar al aspecto de juguete de un botón 100% redondeado.
- **Badges, Indicadores y Botones Flotantes:** Formato píldora (`border-radius: 50px` o `50%`). Denota inmediatez, estado transitorio o elemento satélite.

---

## Components

### 3D Knowledge Planet (KnowledgePlanet)
- **Engine:** Three.js / WebGL con canvas reactivo y soporte inercial de mouse/touch.
- **Geometría:** Núcleo esférico en pizarra oscura (`#070b14`), enjambre de 1800 puntos procedurales según espiral áurea con tintes violetas (`#7c3aed`) y cian (`#38bdf8`), halo atmosférico con shader de Fresnel y dos anillos orbitales elípticos de energía.
- **Nodos:** Pines de emisión de luz interactivos que representan aulas técnicas, divisiones e institutos de investigación con tooltips contextuales holográficos.
- **Resiliencia:** Limitación de `devicePixelRatio` a 2, pausado de render en inactividad y respeto total a `prefers-reduced-motion`.

### Academic Operations Command Center (Admin)
- **Top Telemetry:** 4 bloques de datos de infraestructura (Matrícula, Plantel Docente, Aulas en Red y Tareas Activas) con enlaces directos de filtrado.
- **Matriz de Aislamiento de Divisiones:** Cuadrícula de cursos (*3ro 1ra, 4to 2da*, etc.) que grafica el % de cobertura docente y las materias asignadas.
- **Live Audit Stream:** Panel de telemetría de eventos de seguridad en tiempo real con micro-indicadores cromáticos según la naturaleza del evento.

### Buttons
- **Primary Button:** Fondo `linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)`, texto blanco, sombra `0 4px 14px rgba(124, 58, 237, 0.28)`, radio `10px`, padding `0.65rem 1.4rem`. Al hover: elevación `translateY(-2px)`, sombra `0 8px 20px rgba(124, 58, 237, 0.42)` y gradiente más claro `#8b5cf6 -> #6366f1`.
- **Secondary Button:** Fondo neutro translúcido `rgba(255, 255, 255, 0.06)`, borde `1px solid rgba(255, 255, 255, 0.1)`, texto `#e2e8f0`. Hover: fondo al 10% y borde al 20%.
- **Outline Button:** Fondo transparente, borde `1.5px solid rgba(124, 58, 237, 0.5)`, texto violeta claro `#a78bfa`. Hover: fondo al 10% violeta y borde `#7c3aed`.
- **Danger Button:** Fondo `linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)`, texto blanco, sombra roja.

### Cards
- **Structure:** Superficie `rgba(255, 255, 255, 0.04)` con `backdrop-filter: blur(12px)`, borde sutil `1px solid rgba(255, 255, 255, 0.08)`, radio `18px`, padding `1.5rem` a `2rem`.
- **Card Icon:** Caja cuadrada de `56px x 56px` con radio de `14px`, gradiente violeta/cian de fondo (`rgba(124, 58, 237, 0.2)`), icono centrado `2.2rem` en `#a78bfa`. En hover sobre la tarjeta: rotación leve de `-6deg` y escalado al 108%.
- **Header Accent Line:** Tira superior de 2px en gradiente `#7c3aed -> #06b6d4` que se enciende en hover con opacidad progresiva.

### Input Fields & Forms
- **Field Anatomy:** Etiqueta superior en mayúsculas `0.8rem` en `#94a3b8` con `letter-spacing: 0.03em`. Caja con fondo `rgba(255, 255, 255, 0.04)`, borde `1.5px solid rgba(255, 255, 255, 0.08)`, radio `10px`, texto en `#f1f5f9`.
- **Icon Prefix:** Icono Boxicon alineado a la izquierda (`left: 0.9rem`, tamaño `1.1rem`) en gris `#64748b`; cambia a violeta `#a78bfa` cuando el contenedor recibe foco.
- **Focus State:** Borde violeta `#7c3aed`, halo `box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12)`.
- **Invalid State:** Borde rosa `#f43f5e`, mensaje de error inferior en `0.75rem` color `#f87171`.

### Modals & Dialogs
- **Overlay:** Pantalla completa en `#030014` al 75% con `backdrop-filter: blur(6px)`.
- **Modal Box:** Centrado con fondo `rgba(13, 9, 39, 0.95)`, radio `20px`, borde `1px solid rgba(255, 255, 255, 0.08)`, sombra de profundidad `0 24px 64px rgba(0, 0, 0, 0.6)`. Animación de entrada: deslizamiento vertical de 24px y escalado desde 0.97.

### Tables & Gradebook (Boletín)
- **Container:** Caja cerrada con esquinas redondeadas de `16px`, fondo `rgba(15, 23, 42, 0.6)` y borde exterior de 1px.
- **Header (`thead`):** Fondo translúcido `rgba(255, 255, 255, 0.03)`, texto gris `#94a3b8` en peso 600, sin líneas verticales divisorias.
- **Rows (`tbody tr`):** Separador horizontal de 1px `rgba(255, 255, 255, 0.04)`. Transición suave al posar el cursor. Las notas numéricas destacan en tamaño grande (1.1rem) y color semántico: Verde para $\ge 7$, Ámbar para $< 7$, Gris para sin datos.

### Navigation & Sidebar
- **Header:** Barra superior fija de 64px de alto con `backdrop-filter: blur(16px)` y fondo `rgba(3, 0, 20, 0.5)`. Logo con isotipo iluminado y degradado de marca.
- **Sidebar:** Barra lateral vertical fija a la izquierda (`height: 100vh`), transición elástica de colapso de 260px a 80px. Items de navegación con icono Boxicon, texto en `#94a3b8`, estado activo con fondo violeta atenuado y texto blanco `#f8fafc`.

### Empty States & Errors
- **Empty State:** Bloque centrado con borde discontinuo (*dashed*) `1px dashed rgba(255, 255, 255, 0.08)`, círculo contenedor de icono de `64px` en violeta translúcido, título claro en 1.1rem y botón de acción sugerida.
- **Error State:** Bloque de contingencia con fondo tenue rosa `rgba(244, 63, 94, 0.05)`, borde de advertencia, icono de error centrado y botón de reintento `variant="outline"`.

### Notifications & Toasts
- **Toast Container:** Posición fija arriba a la derecha (`top: 80px, right: 24px`), apilamiento vertical con animación de entrada deslizante `slideIn`.
- **Variantes:** Éxito (verde), Error (rosa), Info (azul eléctrico), Advertencia (ámbar) con desenfoque de 12px y botón de cierre táctil.

### Data Visualizations & Charts
- **LineChart:** Componente SVG responsivo integrado con cálculo dinámico de curva (`path` con comandos M/L), puntos interactivos con efecto de halo en hover y tooltip contextual con métricas de aprobados/desaprobados.
- **Progress Bars:** Barras de porcentaje con radio completo y gradiente horizontal `linear-gradient(90deg, #7c3aed, #38bdf8)`.

### Alfred Virtual Assistant Widget
- **Launcher:** Botón circular flotante de 56px en esquina inferior derecha (`bottom: 25px, right: 25px`) con gradiente `#7c3aed -> #06b6d4`, sombra de resplandor `0 8px 32px rgba(124, 58, 237, 0.4)` y animación de escala al presionar.
- **Window:** Ventana emergente vidriada de 380px de ancho y 550px de alto, cabecera de asistente inteligente y burbujas de diálogo diferenciadas para usuario y bot.

---

## Do's and Don'ts

### Do:
- **Do** utilizar siempre la tríada cromática de identidad: Violeta Tecnológico (`#7c3aed`) como color dominante de marca, Azul Eléctrico (`#38bdf8`) para enlaces y datos dinámicos, y Azul Índigo (`#4f46e5`) para enriquecer gradientes de botones.
- **Do** mantener bordes translúcidos de 1px (`rgba(255, 255, 255, 0.08)`) en todas las tarjetas y contenedores para garantizar contraste estructural en cualquier monitor escolar.
- **Do** preservar los componentes reutilizables base (`Button`, `Card`, `InputField`, `Modal`, `EmptyState`, `ErrorState`, `LoadingSkeleton`) manteniendo coherentes sus radios y rellenos.
- **Do** utilizar exclusivamente la librería de iconos Boxicons (`bx bx-...`) ya integrada en el proyecto, evitando mezclar con emojis o librerías SVG externas incoherentes.
- **Do** implementar siempre estados de carga con `LoadingSkeleton` y vistas vacías informativas con `EmptyState` cuando los datos de cursos o tareas sean nulos.

### Don't:
- **Don't** aplicar fondos completamente blancos (`#ffffff`) o fondos azules planos heredados (`#0b61d6`); la aplicación opera bajo un paradigma dark-mode tecnológico contemporáneo.
- **Don't** saturar pantallas operativas (como el Boletín de Calificaciones o la Corrección de TPs) con animaciones innecesarias o resplandores excesivos que distraigan de la tarea académica.
- **Don't** hardcodear colores hexadecimales directos en estilos en línea (`style={{ color: '#xxx' }}`); canalizar siempre a través de las variables CSS de tokens (`var(--primary)`, `var(--text-main)`, etc.).
- **Don't** utilizar múltiples familias tipográficas dispersas; consolidar en la dupla oficial `'Plus Jakarta Sans'` para lectura general y `'Outfit'` para encabezados y números destacados.
- **Don't** inventar componentes con radios de esquina rectos de 0px o radios de pastilla completa sin justificación funcional; ceñirse a la escala de `8px`, `10px`, `14px`, `18px`, `20px`.

---

### Diagnóstico de Inconsistencias Actuales y Hoja de Ruta Futura

#### Inconsistencias Detectadas en la Base de Código Actual:
1. **Conflicto de Fuentes Tipográficas:**
   - `index.html` vincula `Plus Jakarta Sans`.
   - `index.css` importa `Outfit` e `Inter` y define `--font-family: 'Outfit', 'Inter'`.
   - Los módulos CSS (`components.module.css`, `styles.module.css`, `alfred.css`) sobreescriben la propiedad declarando `font-family: 'Plus Jakarta Sans'`.
   - `App.module.css` (remanente legado) importa `Montserrat`.
2. **Dispersión de Fondos Oscuros:**
   - Coexisten `#030014` (fondo casi negro azulado profundo en Home/Registro) con `#090d16` (fondo grafito oscuro en `index.css`) y `#0b61d6` (azul plano del antiguo diseño en `App.module.css`).
3. **Discrepancia en Radios de Botones y Tarjetas:**
   - `index.css` define variables `--radius-sm: 8px` y `--radius-md: 12px`, pero `components.module.css` utiliza valores directos de `10px` para botones e inputs, `18px` para tarjetas y `14px` para tareas.
4. **Uso Intensivo de Estilos en Línea:**
   - En pantallas como `Dashboard.tsx`, `Boletin.tsx` y `Rendimiento.tsx` existen decenas de bloques `style={{ ... }}` que duplican gradientes y colores que deberían provenir de clases del sistema de tokens.

#### Recomendaciones de Consolidación Futura (TECH-ROOM 29):
1. **Unificación Tipográfica:** Definir formalmente `Outfit` para títulos/números de impacto y `Plus Jakarta Sans` para lectura e inputs, eliminando las referencias a `Montserrat` e `Inter`.
2. **Limpieza de Archivos Legados:** Retirar o refactorizar `App.module.css` y `App1.module.css` para eliminar el color azul saturado `#0b61d6` que no pertenece a la identidad actual.
3. **Consolidación en CSS Variables:** Migrar los estilos en línea de `Dashboard.tsx`, `Boletin.tsx` y `Rendimiento.tsx` hacia módulos CSS que consuman los tokens semánticos definidos en este sistema.

