# REGISTRO HISTÓRICO DE CAMBIOS Y NUEVAS TECNOLOGÍAS — EDUTECH-HUB
**Período comprendido:** 27 de Agosto de 2026 hasta la actualidad  
**Proyecto:** TECH-ROOM 29 / EduTec-Hub  
**Destinatarios:** Profesores evaluadores, arquitectos de software, auditores técnicos y desarrolladores.

---

## 1. CUADRO RESUMEN DE NUEVAS TECNOLOGÍAS Y LIBRERÍAS INCORPORADAS

Durante este período de desarrollo, la arquitectura evolucionó de un prototipo básico hacia una plataforma educativa integral, escalable y en tiempo real. A continuación se detallan las tecnologías introducidas:

| Tecnología / Dependencia | Tipo | Propósito y Responsabilidad en el Sistema |
| :--- | :--- | :--- |
| **Google Gemini Generative AI** (`@google/genai` / `@google/generative-ai`) | SDK / Inteligencia Artificial | Motor cognitivo del asistente pedagógico **Alfred**. Procesa consultas de alumnos, asiste en la redacción de consignas, genera explicaciones paso a paso y valida el aprendizaje adaptativo. |
| **Socket.IO** (`socket.io` y `socket.io-client`) | WebSockets / Tiempo Real | Comunicación bidireccional síncrona. Gestiona el servicio **Aula Activa** (consultas alumno-docente en vivo), la sincronización inmediata de asignaciones y la notificación de cambios de clase a preceptores y administradores sin recargar la página. |
| **Tailwind CSS & PostCSS** | Framework Frontend / UI | Reemplazo del diseño monolítico previo por un sistema de diseño moderno con tokens visuales, degradados institucionales, paleta dark/light y componentes responsivos altamente optimizados. |
| **Lucide React** (`lucide-react`) | Iconografía Vectorial | Estandarización de más de 80 iconos SVG coherentes en toda la aplicación (navegación, estados de carga, filtros, botones de acción). |
| **Bcrypt** (`bcrypt` y `@types/bcrypt`) | Seguridad Criptográfica | Algoritmo de hashing unidireccional con factor de coste (10 salt rounds) para almacenar contraseñas de forma segura, garantizando que ninguna clave se guarde en texto plano. |
| **Nodemailer** (`nodemailer`) | Servicio SMTP / Mensajería | Envío automatizado de correos electrónicos transaccionales: códigos OTP de verificación de identidad, recuperación de contraseñas y notificaciones de inicio de sesión. |
| **Express-Session** | Autenticación y Sesión | Gestión de estado de sesión en memoria del servidor con persistencia de cookies seguras `httpOnly`, sustituyendo el almacenamiento vulnerable en `localStorage`. |
| **Arquitectura de Plugins Desacoplada** | Patrón Arquitectural | Motor de extensiones modular (`/plugins`). Permite registrar módulos independientes (**Preceptoría** y **Oportunidades**) con sus propios controladores, servicios, rutas de API y vistas, sin sobrecargar el núcleo del sistema. |
| **Electron** | Runtime Desktop | Empaquetado de la aplicación como software de escritorio para Windows, orquestando el ciclo de vida del proceso principal (Node.js/Express) y del renderizador (React/Vite). |
| **Vite** | Build Tool / Bundler | Empaquetador de alto rendimiento para React y TypeScript con recarga en caliente (HMR) y compilación optimizada para producción. |

---

## 2. LÍNEA DE TIEMPO Y REGISTRO DETALLADO DE CAMBIOS POR HITOS

### HITO 1: Asistente de IA "Alfred" y Módulos Académicos Iniciales
**Fecha:** 27 de Agosto de 2026 (`ffca158`)
* **Integración del Asistente Alfred con IA:**
  * Implementación de endpoints `/api/alfred/ask` y procesamiento de lenguaje natural conectado a Gemini.
  * Creación de componentes frontend interactivos: `Alfred.tsx`, `AlfredWidget.tsx` y `AlfredVerificationModal.tsx`.
  * Capacidad de Alfred para responder dudas específicas de las materias de cada división técnica.
* **Módulo de Calificaciones y Rendimiento:**
  * Creación del panel de `RendimientoProfesor.tsx`: visualización gráfica de evolución de notas, porcentaje de alumnos aprobados y cálculo de promedios ponderados.
  * Lógica de boletines y actas escolares (`backend/boletin.ts`, `backend/entregas.ts`).
* **Trabajos Prácticos y Evaluaciones:**
  * Flujo de entrega de archivos de tareas con comentarios pedagógicos, retroalimentación formativa y asignación de notas numéricas.

---

### HITO 2: Gran Rediseño Visual y Creación del Panel de Administración
**Fecha:** 9 de Noviembre de 2026 (`15c4477`)
* **Rediseño Completo de la Experiencia de Usuario (UI/UX):**
  * Nueva barra de navegación superior (`Topbar`) y barra lateral (`Sidebar`) contextuales según el rol autenticado.
  * Modernización estética de las vistas `Dashboard.tsx`, `Profile.tsx` y `TrabajoProfesorPage.tsx`.
* **Panel de Control de Administración (`/admin`):**
  * Creación de un sub-sistema exclusivo para usuarios con rol `admin`:
    * `AdminLayout.tsx`: Estructura y navegación de control central.
    * `AdminDashboardPage.tsx`: Métricas del establecimiento (total de docentes, estudiantes, cursos y clases activas).
    * `AdminUsuarios.tsx`: Gestión completa CRUD de cuentas institucionales con filtros por rol, división y estado (`ACTIVO`, `SUSPENDIDO`, `PENDIENTE_DE_ASIGNACION`).
    * `AdminClases.tsx`: Creación y gestión de aulas virtuales con códigos alfanuméricos únicos.
    * `AdminAsignaciones.tsx`: Matriz interactiva para asignar docentes titulares a las distintas materias.
  * Desarrollo del controlador backend `backend/admin_api.ts` con validación estricta de privilegios de superusuario.

---

### HITO 3: Blindaje de Autenticación, Sesiones y Seguridad (RBAC)
**Fecha:** 11 y 12 de Noviembre de 2026 (`827cd5d`, `bc05beb`)
* **Eliminación de Vulnerabilidades en Sesión:**
  * Se reemplazó el almacenamiento de roles en el navegador (`localStorage`) por validación estricta mediante cookies seguras y sesiones de Express.
  * Creación del middleware centralizado de permisos `backend/permisos.ts`:
    * `verificarRol('admin')`: Bloqueo total de accesos no autorizados a configuración institucional.
    * `verificarProfesorDeClase()`: Garantiza que un docente únicamente pueda calificar o ver tareas de sus materias asignadas.
    * `verificarAlumnoDeClase()`: Impide que alumnos vean contenidos o exámenes de divisiones a las que no pertenecen.
* **Aislamiento Estricto por División:**
  * Se programó la regla de que las clases se crean inicialmente vacías (0 alumnos y 0 docentes) hasta que el administrador o el código de clase determine la vinculación, evitando fugas de información inter-cursos.

---

### HITO 4: Creación de la Arquitectura de Plugins e Integración de Preceptoría y Oportunidades
**Fecha:** 12 al 15 de Noviembre de 2026 (`bc05beb`, `3e80e0d`, `9b6af42`)
* **Motor de Plugins Modular (`/plugins`):**
  * Implementación de una arquitectura inspirada en micro-módulos que permite desacoplar nuevas funcionalidades institucionales sin modificar el core.
* **Plugin 1: EduTech Preceptoría (`plugins/edutech-preceptoria`):**
  * **Asistencia Escolar de Alumnos:**
    * Toma de lista diaria por curso con estados normalizados: `PRESENTE`, `AUSENTE`, `TARDE`, `JUSTIFICADO`.
    * Consulta histórica de porcentaje de presentismo tanto para el preceptor como para el estudiante.
  * **Constancias de Alumno Regular:**
    * Sistema de solicitud online de constancias por parte del alumno.
    * Aprobación y firma digital por parte de preceptoría con generación de código alfanumérico único para validación externa.
  * **Asistencia Laboral Docente:**
    * Registro de presentismo y partes médicos del personal docente.
* **Plugin 2: EduTech Oportunidades (`plugins/edutech-oportunidades`):**
  * Portal de pasantías técnico-profesionales y becas formativas para alumnos de escuelas técnicas.
  * Catálogo con filtros avanzados por especialidad (Informática, Electrónica, Mecánica, etc.), modalidad y vacantes.
  * Formulario de postulación con carga de carta de motivación, conocimientos previos y disponibilidad horaria.
  * Panel de gestión de aspirantes para profesores y directivos con estados de postulación (`pendiente`, `aprobada`, `rechazada`).

---

### HITO 5: Corrección de Asistencias, Documentación Pedagógica y Asignación de Preceptores
**Fecha:** 16 y 17 de Noviembre de 2026 (`f204cdb`, `02d1f63`, `f586ff9`, `29a87fb`)
* **Auditoría y Reparación del Módulo de Asistencias:**
  * Detección de fallos en llamadas de asistencia cuando una fecha no tenía lista pasada previamente.
  * Implementación de un mecanismo robusto que devuelve siempre la nómina completa de alumnos inscriptos con estado inicial por defecto, eliminando errores de pantalla rota o excepciones 500.
* **Asignación de Clases a Preceptores desde el Panel de Administrador:**
  * Modificación de la base de datos y endpoints para soportar relaciones muchos a muchos entre preceptores y cursos (`preceptores_clases`).
  * Creación de la pestaña "Asignación de Preceptoría" dentro de `AdminAsignaciones.tsx`, permitiendo asignar o revocar múltiples divisiones a un preceptor con persistencia atómica y notificaciones de éxito/error.
  * Sincronización en vivo con Socket.IO (`preceptor.classes_updated` y `teacher.assigned`) para que el preceptor vea sus cursos actualizados en el acto sin cerrar sesión.
* **Documentación Técnica Integral y Comentado del Código:**
  * Inserción de comentarios explicativos con enfoque técnico y pedagógico en todos los archivos de los plugins y backend central (controladores, servicios, middlewares, vistas).
  * Redacción de manuales técnicos en la carpeta `docs/documentacion-plugins/` (Backend, Frontend, Diagramas de Flujo, Glosario de Términos).

---

## 3. COMPARATIVA ARQUITECTURAL: ANTES VS. DESPUÉS

| Aspecto | Estado al 27 de Agosto de 2026 | Estado Actual |
| :--- | :--- | :--- |
| **Asistente de IA** | Respuestas estáticas básicas | **Alfred con IA Generativa contextual conectada a Gemini**, adaptada al contexto de cada materia. |
| **Tiempo Real** | Peticiones HTTP repetitivas (polling) | **WebSockets bidireccionales con Socket.IO**, salas por clase y eventos instantáneos. |
| **Diseño y Estilos** | CSS personalizado disperso | **Diseño moderno unificado con Tailwind CSS**, paleta de diseño institucional y soporte responsivo. |
| **Gestión Institucional** | Inexistente / Manual | **Panel de Administrador completo** (control de usuarios, división de cursos, asignaciones docentes y preceptores). |
| **Asistencias** | Sin módulo de preceptoría | **Plugin de Preceptoría integral** (asistencias de alumnos, constancias con verificación y control laboral de profesores). |
| **Vinculación Laboral** | No disponible | **Plugin de Oportunidades** (bolsa de pasantías técnicas y gestión de postulaciones). |
| **Seguridad de Cuentas** | Claves sin hash estandarizado | **Bcrypt con 10 rounds**, validación OTP por Nodemailer y control RBAC en servidor. |
| **Mantenibilidad** | Código acoplado | **Arquitectura modular de plugins**, interfaces tipadas en TypeScript y compilación estricta sin errores. |
