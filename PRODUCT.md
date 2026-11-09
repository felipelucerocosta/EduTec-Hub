# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Estudiantes (13–18 años), profesores y directivos/administradores de instituciones de educación secundaria (tanto técnica como general) en Argentina.
- **Estudiantes:** Acceden para revisar consignas de materias, entregar trabajos prácticos (TPs), consultar devoluciones y visualizar su boletín oficial de calificaciones periódicas.
- **Profesores:** Gestionan sus cursos asignados, crean y evalúan trabajos prácticos con rúbricas y devoluciones, cargan notas periódicas y publican material didáctico.
- **Administradores:** Gestionan el padrón de usuarios, crean clases y divisiones, realizan la asignación explícita de docentes y alumnos, y supervisan métricas institucionales globales.
- **Entorno de uso:** Aulas de informática y talleres escolares con conectividad y hardware variables, así como dispositivos personales y compartidos en el hogar.

## Product Purpose

Proveer un entorno integral de gestión educativa y aula virtual ajustado a la realidad operativa del sistema escolar secundario argentino, garantizando orden administrativo, privacidad estricta de cursos y claridad total en el seguimiento pedagógico y académico.

## Positioning

Aislamiento riguroso por divisiones (3ro 1ra, 4to 2da, etc.) bajo la regla de oro: *existir en la base de datos no implica ser visible para el usuario*. A diferencia de plataformas genéricas de aprendizaje en línea (LMS) orientadas a la autogestión o cursos abiertos, EduTechHub replica de forma fiel la estructura jerárquica, las divisiones escolares y el régimen de calificaciones oficial (trimestres/cuatrimestres, notas numéricas y boletín) de las escuelas secundarias argentinas sin permitir matriculaciones cruzadas o accidentales.

## Operating Context

- **Organización académica:** Ciclos lectivos estructurados en divisiones anuales estancas y materias curriculares.
- **Régimen de evaluación:** Períodos académicos oficiales (trimestres o cuatrimestres), calificaciones numéricas y emisión de boletín de calificaciones.
- **Flujo de trabajos:** Asignación de TPs con fecha límite, entrega de archivos adjuntos, corrección docente con comentarios/devolución y reentrega si corresponde.
- **Entorno tecnológico:** Plataforma web responsiva accesible mediante navegadores modernos y aplicación ejecutable de escritorio para Windows empaquetada mediante Electron.

## Capabilities and Constraints

- **Control de Acceso Basado en Roles (RBAC):** Perfiles estrictamente diferenciados para Administrador, Profesor y Alumno.
- **Aislamiento por División:** Ninguna clase comparte contenido, alumnos ni profesores a menos que exista asignación explícita en base de datos.
- **Gestión de Trabajos Prácticos:** Carga de consignas, recepción de archivos y devoluciones pedagógicas.
- **Boletín Oficial:** Vista consolidada del rendimiento por períodos académicos para alumnos y docentes.
- **Módulo de Rendimiento:** Visualización estadística del progreso individual y por curso.
- **Asistente Institucional Alfred:** Soporte guiado para alta y recuperación segura de credenciales mediante códigos de verificación de un solo uso.
- **Soporte Offline/Desktop:** Capacidad de ejecución local como cliente de escritorio en entornos Windows vía Electron.

## Brand Commitments

- **Nombre:** EduTechHub
- **Tono y Voz:** Institucional escolar, respetuoso, directo, accesible y enfocado en la claridad operativa sin artificios innecesarios.

## Evidence on Hand

- Código fuente completo del cliente React 19 / TypeScript / Vite en `frontend/`.
- Backend en Node.js / Express / TypeScript con persistencia SQLite3 / PostgreSQL en `backend/`.
- Esquema relacional documentado en `database_schema.sql` y `edutechhub.sql`.
- Manual Técnico y Funcional detallado en [docs/MANUAL_TECNICO_FUNCIONAL.md](file:///c:/Users/marti/EduTec-Hub/docs/MANUAL_TECNICO_FUNCIONAL.md).
- Cuentas de prueba documentadas en [TESTING_CREDENTIALS.md](file:///c:/Users/marti/EduTec-Hub/TESTING_CREDENTIALS.md).

## Product Principles

1. **Aislamiento y privacidad por diseño:** Los límites entre divisiones y cursos son inviolables; un usuario solo interactúa con los contenidos explícitamente autorizados para su rol y división.
2. **Fidelidad al proceso escolar real:** Cada flujo (desde la designación docente hasta el cierre de notas en el boletín) reproduce fielmente la práctica institucional argentina.
3. **Claridad sobre ornamentación:** La tarea principal (entregar, corregir, consultar notas) debe completarse de forma inmediata, minimizando la carga cognitiva en interfaces operativas.
4. **Resiliencia en hardware modesto:** La interfaz y las interacciones deben responder de manera ágil en equipos estándar de laboratorios escolares y conexiones con ancho de banda limitado.

## Accessibility & Inclusion

- Contraste visual elevado y tipografía de alta legibilidad apta para pantallas de resolución estándar o monitores escolares.
- Navegación completa por teclado en formularios y tablas de calificaciones.
- Estructura semántica accesible que cumpla con los lineamientos WCAG 2.1 nivel AA.

