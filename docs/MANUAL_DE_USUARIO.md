# Manual de Usuario Integral — EduTec-Hub (TECH-ROOM 29)

**Plataforma de Gestión Educativa, Aprendizaje Técnico y Campus Digital**  
*Escuela de Educación Técnica N° 29 DE 6 — Ciudad Autónoma de Buenos Aires*

---

## Índice General

1. [Introducción y Visión General](#1-introducción-y-visión-general)
2. [Acceso, Cuentas y Seguridad](#2-acceso-cuentas-y-seguridad)
   - 2.1 [Registro de Nuevos Usuarios](#21-registro-de-nuevos-usuarios)
   - 2.2 [Inicio de Sesión (Login)](#22-inicio-de-sesión-login)
   - 2.3 [Recuperación de Contraseña](#23-recuperación-de-contraseña)
   - 2.4 [Perfil de Usuario y Preferencias](#24-perfil-de-usuario-y-preferencias)
3. [Navegación e Interfaz Digital](#3-navegación-e-interfaz-digital)
   - 3.1 [Barra Superior (Console Topbar) y Períodos](#31-barra-superior-console-topbar-y-períodos)
   - 3.2 [Barra Lateral (Sidebar Dinámica)](#32-barra-lateral-sidebar-dinámica)
   - 3.3 [Paleta de Comandos Rápidos (Ctrl + K)](#33-paleta-de-comandos-rápidos-ctrl--k)
   - 3.4 [Planeta de Conocimiento 3D y Estética Tech](#34-planeta-de-conocimiento-3d-y-estética-tech)
4. [Manual por Roles](#4-manual-por-roles)
   - 4.1 [Manual del Alumno](#41-manual-del-alumno)
   - 4.2 [Manual del Profesor](#42-manual-del-profesor)
   - 4.3 [Manual del Preceptor](#43-manual-del-preceptor)
   - 4.4 [Manual del Administrador](#44-manual-del-administrador)
5. [Módulos Transversales y Especiales](#5-módulos-transversales-y-especiales)
   - 5.1 [Asistente Inteligente Alfred (AI Companion)](#51-asistente-inteligente-alfred-ai-companion)
   - 5.2 [Laboratorios y Simuladores Técnicos](#52-laboratorios-y-simuladores-técnicos)
   - 5.3 [Foro Comunitario y Novedades](#53-foro-comunitario-y-novedades)
   - 5.4 [Calendario Académico y Vencimientos](#54-calendario-académico-y-vencimientos)
   - 5.5 [Módulo de Oportunidades y Pasantías](#55-módulo-de-oportunidades-y-pasantías)
6. [Preguntas Frecuentes y Solución de Problemas (FAQ)](#6-preguntas-frecuentes-y-solución-de-problemas-faq)

---

## 1. Introducción y Visión General

**EduTec-Hub** es un ecosistema digital integral desarrollado específicamente para responder a las dinámicas formativas, técnicas y de taller de las escuelas técnicas. Combina la gestión pedagógica de clases virtuales con laboratorios interactivos simulados, seguimiento de rendimiento académico basado en competencias, comunicación en tiempo real y asistencia inteligente.


* **Seguridad y Persistencia Centralizada:** Toda la información académica, usuarios, notas y asistencias está respaldada en una base de datos relacional robusta en PostgreSQL.
* **Control de Acceso Basado en Roles (RBAC):** Cada integrante de la comunidad educativa (Alumno, Profesor, Preceptor y Administrador) posee permisos específicos y una interfaz adaptada a sus responsabilidades.

---

## 2. Acceso, Cuentas y Seguridad

### 2.1 Registro de Nuevos Usuarios
Para integrarse a la plataforma, los usuarios deben registrarse seleccionando su rol correspondiente:
1. Acceder a la pantalla principal y hacer clic en **"Crear Cuenta"** o navegar a `/registro`.
2. Seleccionar la pestaña según el rol institucional:
   * **Alumno:** Requiere Nombre completo, DNI, Correo electrónico, Contraseña, Nivel Educativo (e.g., *Nivel Secundario Técnico*) y Curso (e.g., *1ro a 6to año*).
   * **Profesor:** Requiere Nombre completo, DNI, Correo electrónico, Contraseña, Materia/Especialidad y Nivel Educativo.
   * **Preceptor:** Requiere Nombre completo, DNI, Correo electrónico, Contraseña, Nivel Educativo y Turno (Mañana, Tarde, Noche).
3. Hacer clic en **"Crear Cuenta"**. El sistema valida los datos y registra la cuenta directamente en la base de datos central.

### 2.2 Inicio de Sesión (Login)
1. Ingresar el **correo electrónico registrado** y la **contraseña**.
2. Presionar **"Iniciar Sesión"**.
3. El sistema verificará el estado de la cuenta (`ACTIVO`). Si el usuario tiene acceso aprobado, será redirigido inmediatamente a su **Dashboard Principal**.

### 2.3 Recuperación de Contraseña
En caso de extravío de credenciales:
1. Desde la pantalla de acceso, presionar el enlace **"¿Olvidaste tu contraseña?"** (`/forgot-password`).
2. Ingresar el correo electrónico registrado.
3. Se emitirá un token seguro y temporal con el enlace de restablecimiento.
4. Ingresar al enlace (`/reset-password?token=...`), escribir la nueva contraseña, confirmarla y presionar **"Actualizar Contraseña"**.

### 2.4 Perfil de Usuario y Preferencias
Accediendo a la sección **"Mi Perfil"** (`/perfil`) desde el menú de usuario:
* Visualización de datos de afiliación (DNI, rol, nivel educativo, curso/turno asignado).
* Cambio de contraseña actual por una nueva.
* Revisión del estado de matriculación en la institución.

---

## 3. Navegación e Interfaz Digital

La plataforma cuenta con un diseño unificado y accesible desde cualquier dispositivo:

### 3.1 Barra Superior (Console Topbar) y Períodos
Ubicada en la parte superior fija de la pantalla:
* **Indicador Institucional:** Identificación oficial de la institución *TECH-ROOM 29*.
* **Selector de Período Académico:** Permite alternar entre los distintos trimestres/cuatrimestres del ciclo lectivo para filtrar notas y actividades.
* **Notificaciones en Vivo:** Campana con alertas sobre nuevas tareas asignadas, devoluciones de notas y anuncios del tablón.
* **Tarjeta de Usuario:** Muestra el avatar, nombre completo y rol activo, con menú desplegable para acceder a Perfil o **Cerrar Sesión**.

### 3.2 Barra Lateral (Sidebar Dinámica)
Menú colapsable a la izquierda que adapta automáticamente sus opciones según los privilegios del usuario:
* **Alumnos:** Dashboard, Mis Clases, Rendimiento, Boletín, Simuladores, Foros, Calendario, Oportunidades, Asistencia.
* **Profesores:** Dashboard, Gestión de Clases, Rendimiento Áulico, Oportunidades, Foros, Calendario, Simuladores.
* **Preceptores:** Dashboard, Control de Asistencia, Constancias, Estadísticas, Foros, Calendario.
* **Administradores:** Consola de Administración, Usuarios, Clases Institucionales, Asignaciones Masivas, Auditoría.

### 3.3 Paleta de Comandos Rápidos (`Ctrl + K`)
Presionando la combinación de teclas **`Ctrl + K`** (o `Cmd + K` en macOS) desde cualquier pantalla, se abre la consola de búsqueda instantánea que permite:
* Saltar directamente a cualquier clase o materia.
* Abrir simuladores específicos (e.g. *Circuitos*, *Redes*).
* Consultar trabajos prácticos pendientes o acceder al boletín sin navegar por los menús.

### 3.4 Planeta de Conocimiento 3D y Estética Tech
En el Dashboard principal se encuentra un visualizador interactivo tridimensional (*Knowledge Planet*) programado en WebGL/Three.js que representa la red de conocimientos del estudiante o docente, reaccionando dinámicamente al cursor y al progreso del alumno.

---

## 4. Manual por Roles

---

### 4.1 Manual del Alumno

El alumno utiliza EduTec-Hub como su campus digital diario para acceder a los contenidos de clase, entregar tareas, comprobar sus calificaciones y experimentar en simuladores.

#### A. Mis Clases y Aula Virtual (`/alumno`)
1. Al ingresar a **"Mis Clases"**, se listan todas las materias en las que el alumno está inscripto con el nombre del profesor titular.
2. Hacer clic en una tarjeta de clase para ingresar a su **Aula Virtual** (`/alumno/gestion/:claseId`):
   * **Tablón de Anuncios:** Mensajes y avisos publicados por el docente con actualizaciones en tiempo real.
   * **Material de Estudio:** Acceso a documentos, bibliografía técnica, PDFs y enlaces compartidos por el docente.
   * **Trabajos Prácticos:** Lista de tareas asignadas con su fecha límite y estado (*Pendiente*, *Entregado*, *Calificado*).

#### B. Detalle y Entrega de Trabajos Prácticos (`/trabajo/:trabajoId`)
1. Dentro del trabajo, el alumno puede leer las consignas completas, criterios de evaluación y fecha límite de entrega.
2. **Realizar una Entrega:**
   * Redactar una respuesta o enlace de repositorio en el campo de texto.
   * Adjuntar el archivo o informe técnico correspondiente.
   * Presionar **"Confirmar Entrega"**. El estado cambiará automáticamente a *Entregado*.
3. **Revisión y Devolución:**
   * Una vez corregido por el profesor, el alumno podrá ver su **nota numérica** (o escala técnica), la **devolución pedagógica** y los comentarios privados del docente.

#### C. Boletín Oficial de Calificaciones (`/boletin`)
* Muestra la sábana de notas oficial del estudiante dividida por materias y períodos.
* Presenta los promedios parciales, notas de informes de taller y la condición final (*Aprobado*, *En Proceso*, *Pendiente de acreditación*).

#### D. Rendimiento Académico y Competencias (`/rendimiento`)
* Gráfico de radar con las áreas de especialización técnica (Programación, Hardware, Redes, Lógica Matemática).
* Histórico de entregas a tiempo versus entregas fuera de término.
* Proyección de rendimiento para el cierre del ciclo lectivo.

---

### 4.2 Manual del Profesor

El profesor cuenta con herramientas para gestionar sus comisiones, dictar clases, compartir material, publicar trabajos evaluativos y asentar calificaciones.

#### A. Gestión de Clases (`/clases`)
1. En la vista principal el profesor visualiza todas sus comisiones activas.
2. Puede crear una nueva clase con el botón **"+ Nueva Clase"**, indicando:
   * Nombre de la materia (e.g., *Sistemas Operativos II*).
   * Curso y División (e.g., *5to 1ra Computación*).
   * Descripción y horario de cursada.
3. Al hacer clic en una clase accede al panel de administración docente (`/gestionClase/:claseId`).

#### B. Publicación de Materiales y Anuncios
1. En la pestaña **"Novedades / Tablón"**: escribir anuncios para el curso y presionar **"Publicar"**. Se transmite instantáneamente al muro de todos los alumnos inscriptos.
2. En la pestaña **"Materiales"**: hacer clic en **"Subir Material"**, ingresar título, descripción pedagógica y adjuntar el archivo o URL.

#### C. Creación de Trabajos Prácticos
1. En la pestaña **"Trabajos"**, presionar **"+ Crear Trabajo"**.
2. Completar:
   * **Título** del trabajo y consigna detallada.
   * **Fecha y hora límite de entrega**.
   * **Puntaje máximo** (escala del 1 al 10).
3. Presionar **"Guardar y Publicar"**.

#### D. Corrección, Calificación y Retroalimentación (`/gestionClase/:claseId/trabajo/:trabajoId`)
1. Al ingresar a un trabajo práctico específico, el profesor accede a la **Matriz de Entregas**.
2. Tabla con el listado de alumnos:
   * Identifica quiénes entregaron a tiempo, con demora o no han entregado.
3. Al hacer clic en un alumno:
   * Puede descargar y visualizar el archivo enviado por el estudiante.
   * Ingresar la **Calificación** (1 al 10).
   * Escribir la **Devolución / Comentario cualitativo**.
   * Presionar **"Guardar Calificación"**. El alumno recibirá la notificación en su panel.

#### E. Creación de Oportunidades y Pasantías (`/oportunidades`)
* El profesor tiene la facultad de conectar a sus alumnos con el ámbito profesional.
* Dispone del botón **"+ Agregar Oportunidad"** para publicar pasantías técnicas, proyectos o becas vinculadas a su especialidad.

---

### 4.3 Manual del Preceptor

El preceptor es el responsable del control de asistencia, seguimiento institucional de los cursos y emisión de constancias para los alumnos.

#### A. Toma de Asistencia Diaria (`/asistencia` o `/preceptoria`)
1. Seleccionar el **Curso y División** (e.g., *4to 2da Electrónica*) y la **Fecha**.
2. El sistema despliega la lista completa de alumnos del curso.
3. Para cada alumno, marcar el estado correspondiente con un clic:
   * **P (Presente):** Asistencia regular.
   * **A (Ausente):** Inasistencia injustificada.
   * **J (Justificado):** Inasistencia amparada por certificado médico/nota de tutores.
   * **T (Tarde):** Llegada con retraso reglamentario.
4. Presionar **"Guardar Asistencia"** para consolidar el parte diario en PostgreSQL.

#### B. Gestión y Emisión de Constancias Estudiantiles
1. En la pestaña **"Constancias"**, buscar al alumno por DNI o Nombre.
2. Seleccionar el tipo de trámite requerido (*Constancia de Alumno Regular*, *Presentación a Examen*, *Asignación Familiar*).
3. Generar el documento oficial con código de validación institucional listo para imprimir o enviar.

#### C. Estadísticas y Alertas Tempranas
* Reportes automáticos de alumnos que superan el límite preventivo de inasistencias (15 y 20 faltas) para coordinar entrevistas con el equipo de orientación y las familias.

---

### 4.4 Manual del Administrador

El administrador ejerce la gobernanza técnica de la plataforma, garantizando que los usuarios, comisiones y asignaciones estén sincronizados.

#### A. Panel General (`/admin`)
* Resumen de métricas globales: Total de usuarios registrados, cantidad de comisiones activas, asistencias asentadas y tasa de actividad en la plataforma.

#### B. Gestión de Usuarios (`/admin/usuarios`)
1. Búsqueda y filtrado por Rol, Nombre, Correo o DNI.
2. Modificación de roles institucionales (promoción de usuario a profesor, preceptor o administrador).
3. **Control de Estado de Acceso:**
   * `ACTIVO`: Usuario con acceso pleno.
   * `PENDIENTE_DE_ASIGNACION`: Usuario recién registrado a la espera de validación de legajo.
   * `SUSPENDIDO`: Acceso bloqueado de forma temporal o preventiva.

#### C. Creación Institucional de Clases (`/admin/clases`)
* Creación centralizada del mapa curricular anual (materias troncales, talleres de ciclo básico y ciclo superior, laboratorios de especialidad).

#### D. Asignaciones y Matriculación (`/admin/asignaciones`)
1. Seleccionar la clase o materia de destino.
2. **Asignación de Profesor Titular:** Vincular el docente responsable de la cátedra.
3. **Matriculación de Alumnos:** Seleccionar los estudiantes correspondientes a esa división para vincularlos a la clase. Las asignaciones tienen impacto inmediato en la base de datos sin necesidad de reinicio de servicios.

---

## 5. Módulos Transversales y Especiales

---

### 5.1 Asistente Inteligente Alfred (AI Companion)
**Alfred** es el asistente virtual y tutor técnico que acompaña al usuario en la esquina inferior derecha de la pantalla.
* **Interactividad:** Puede desplegarse u ocultarse haciendo clic sobre su sprite animado.
* **Funciones para Alumnos:**
  * Asistencia para entender consignas de trabajos prácticos de programación, circuitos y redes.
  * Recordatorio de fechas de exámenes y entregas próximas.
  * Respuestas rápidas sobre trámites de la escuela (horarios de secretaría, fechas de mesas de examen).
* **Funciones para Docentes:**
  * Generación de ideas para ejercicios prácticos y rúbricas de evaluación.

---

### 5.2 Laboratorios y Simuladores Técnicos (`/simuladores`)
Módulo diseñado para la experimentación directa desde el navegador, sin necesidad de software externo:

1. **Física y Circuitos Eléctricos:**
   * Cálculo interactivo de Ley de Ohm ($V = I \cdot R$).
   * Armado de circuitos en serie, paralelo y mixtos con visualización de caída de tensión y corriente en tiempo real.
2. **Redes y Telecomunicaciones:**
   * **Calculadora de Subnetting:** Cálculo de máscaras de subred CIDR (`/24`, `/28`, etc.), broadcast, red y hosts útiles.
   * **Simulador de Topologías:** Modelado de redes Estrella, Anillo, Malla y Árbol con análisis de redundancia ante caída de nodos.
3. **Desarrollo de Software y Metodologías:**
   * Tablero interactivo Scrum / Kanban para estimación de historias de usuario y sprint backlogs.
4. **Matemáticas Aplicadas:**
   * Graficador interactivo de funciones lineales, cuadráticas y trigonométricas.
   * Laboratorio de resolución de ecuaciones algebraicas y cálculo probabilístico.
5. **Lengua y Análisis de Textos Técnicos:**
   * Herramienta de análisis sintáctico y estructuración de informes técnicos e instructivos de ingeniería.

---

### 5.3 Foro Comunitario y Novedades (`/foro`)
* Espacio de intercambio colaborativo entre alumnos y docentes de toda la escuela.
* Categorías temáticas: Consultas Generales, Club de Robótica, Programación y Proyectos de Taller.
* Permite crear hilos de discusión, responder con formato de código y votar respuestas útiles.

---

### 5.4 Calendario Académico y Vencimientos (`/calendario`)
* Vista de mes, semana o agenda con código de colores según el tipo de evento:
  * 🔴 **Rojo:** Vencimiento improrrogable de Trabajo Práctico.
  * 🔵 **Azul:** Evaluaciones y mesas de examen.
  * 🟢 **Verde:** Actividades institucionales y feriados escolares.
* Integración bidireccional: al crear un trabajo práctico con fecha de entrega, el evento se crea de forma automática en el calendario de todos los alumnos de esa comisión.

---

### 5.5 Módulo de Oportunidades y Pasantías (`/oportunidades`)
Vinculación con el sector productivo y profesional técnico:
* **Explorar Oportunidades:** Cartelera de convocatorias a pasantías laborales, becas de estudio, concursos de innovación y proyectos técnicos abiertos.
* **Postulación del Alumno:** El alumno puede hacer clic en **"Postularme"**, adjuntar su portafolio o CV y dejar un mensaje de presentación.
* **Gestión Docente/Admin:** Los profesores y directivos pueden gestionar las vacantes, revisar los perfiles de los alumnos postulados y aprobar su derivación a las empresas asociadas.

---

## 6. Preguntas Frecuentes y Solución de Problemas (FAQ)

### ¿Qué hago si olvidé mi contraseña o no puedo ingresar?
Hacé clic en **"¿Olvidaste tu contraseña?"** en la pantalla de inicio. Se generará un enlace para restablecerla. Si continuás con inconvenientes, un Administrador o Preceptor puede verificar en su panel que tu cuenta no se encuentre en estado `SUSPENDIDO`.

### ¿Por qué como alumno no veo ninguna clase asignada?
Al registrarte, tu cuenta es creada con éxito en la base de datos. Para que aparezcan tus materias, el Administrador o tu Profesor debe asignarte a la división correspondiente desde el panel de asignaciones. Una vez asignado, hacé clic en refrescar (F5) para ver tus aulas virtuales.

### ¿Qué formatos de archivo soporta la entrega de trabajos prácticos?
La plataforma acepta documentos PDF, archivos comprimidos ZIP/RAR (para proyectos de software o esquemas CAD), imágenes (JPG, PNG) y enlaces a repositorios de GitHub o GitLab.

### ¿Los datos se guardan al cerrar la ventana o navegador?
Sí. Toda la información (entregas, notas, asistencias, publicaciones del tablón y foros) se almacena de forma permanente en la base de datos central PostgreSQL de la institución. Al volver a iniciar sesión desde cualquier dispositivo, encontrarás tus datos exactamente en el estado en que los dejaste.

---
*Manual oficial de EduTec-Hub — TECH-ROOM 29. Escuela de Educación Técnica N° 29 DE 6.*
