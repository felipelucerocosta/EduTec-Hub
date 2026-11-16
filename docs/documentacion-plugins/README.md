# Documentación Técnica Integral — Plugins de TECH-ROOM 29 (EduTec-Hub)

Bienvenido a la documentación técnica oficial de los plugins desarrollados para la plataforma de gestión académica y técnica **TECH-ROOM 29 / EduTec-Hub** (Escuela de Educación Técnica N.º 29 D.E. 6 «Reconquista de Buenos Aires»).

Este compendio documental fue diseñado con un enfoque educativo, riguroso y profesional, permitiendo que directivos, docentes evaluadores, inspectores y desarrolladores externos comprendan en profundidad la arquitectura, implementación, flujo de datos y decisiones técnicas adoptadas en los dos plugins del sistema:

1. **EduTech Preceptoría (`edutech-preceptoria`)**: Sistema exclusivo de control de presentismo escolar y laboral, condición de regularidad académica y expedición oficial de constancias de alumno regular.
2. **EduTech Oportunidades (`edutech-oportunidades`)**: Portal institucional de prácticas profesionalizantes, pasantías laborales formativas, proyectos de I+D y becas técnicas.

---

## Índice General de la Documentación

La documentación se organiza de forma modular en los siguientes archivos temáticos:

| Documento | Enlace | Contenido Principal |
| :--- | :--- | :--- |
| **1. Guía General** | [README.md](file:///c:/Users/marti/EduTec-Hub/docs/documentacion-plugins/README.md) | Introducción, objetivos, visión general y mapa del sistema. |
| **2. Arquitectura Backend** | [BACKEND.md](file:///c:/Users/marti/EduTec-Hub/docs/documentacion-plugins/BACKEND.md) | Servidor Express, endpoints REST, controladores, servicios, base de datos SQLite y middlewares de autorización. |
| **3. Arquitectura Frontend** | [FRONTEND.md](file:///c:/Users/marti/EduTec-Hub/docs/documentacion-plugins/FRONTEND.md) | Vistas React, componentes modulares, gestión de estado, estilos CSS Modules y clientes de API Fetch. |
| **4. Integración y Flujo** | [INTEGRACION.md](file:///c:/Users/marti/EduTec-Hub/docs/documentacion-plugins/INTEGRACION.md) | Ciclo de vida de una petición, comunicación Cliente-Servidor y eventos en tiempo real mediante WebSockets. |
| **5. Diagramas Técnicos** | [DIAGRAMAS.md](file:///c:/Users/marti/EduTec-Hub/docs/documentacion-plugins/DIAGRAMAS.md) | Diagramas de arquitectura, modelo entidad-relación (ER) y diagramas de secuencia en formato Mermaid. |
| **6. Glosario Técnico** | [GLOSARIO-TECNICO.md](file:///c:/Users/marti/EduTec-Hub/docs/documentacion-plugins/GLOSARIO-TECNICO.md) | Conceptos teóricos de ingeniería de software, bases de datos y redes vinculados a código real. |
| **7. Recorrido de Código** | [RECORRIDO-DE-CODIGO.md](file:///c:/Users/marti/EduTec-Hub/docs/documentacion-plugins/RECORRIDO-DE-CODIGO.md) | Guía didáctica paso a paso para estudiar y comprender el código fuente de cero a experto. |

---

## Resumen Ejecutivo de la Solución

### El Paradigma de Plugins Desacoplados
A diferencia de los sistemas monolíticos tradicionales, donde cada nueva funcionalidad altera la base de datos central y los controladores existentes con riesgo de regresiones, EduTec-Hub implementa el **Patrón Plugin/Microkernel**:
- **Aislamiento de Rutas**: Cada plugin se monta bajo un prefijo de espacio de nombres aislado (`/api/plugins/<id-plugin>`), evitando colisiones con las rutas del núcleo de la plataforma.
- **Aislamiento de Esquema**: Cada plugin crea sus propias tablas mediante scripts de migración idempotentes con prefijo (`plugin_*`) y claves foráneas hacia las tablas centrales (`usuarios`, `clases`).
- **Tolerancia a Fallos**: Si un plugin se desactiva mediante su manifiesto (`enabled: false`) o falla durante su arranque, el servidor backend captura la excepción y continúa operando de forma ininterrumpida.

---

## Estructura Física del Proyecto

```
c:/Users/marti/EduTec-Hub/
├── plugins/
│   ├── plugin_types.ts                          <-- Contratos TypeScript universales
│   ├── index.ts                                 <-- Registro Central (PluginRegistry)
│   │
│   ├── edutech-preceptoria/                     <-- Plugin 1: Asistencia y Preceptoría
│   │   ├── manifest.json                        <-- Metadatos y configuración
│   │   ├── backend/
│   │   │   ├── index.ts                         <-- Punto de entrada del microservicio
│   │   │   ├── database/setup_plugin_db.ts      <-- Esquema DDL de tablas e índices
│   │   │   ├── middleware/preceptoria_auth.ts   <-- Guardas de seguridad y roles
│   │   │   ├── services/preceptoria_service.ts  <-- Reglas de negocio y SQL
│   │   │   ├── controllers/preceptoria_controller.ts <-- Manejadores de solicitudes HTTP
│   │   │   └── routes/preceptoria_routes.ts     <-- Mapeo de rutas REST
│   │   └── frontend/
│   │       ├── services/preceptoria_api.ts      <-- Cliente HTTP Fetch tipado
│   │       ├── pages/PreceptoriaPage.tsx        <-- Orquestador de vistas por rol
│   │       ├── styles/preceptoria.module.css    <-- Estilos modulares espaciales
│   │       └── components/                      <-- Vistas especializadas
│   │           ├── AsistenciasAlumnoView.tsx    <-- Presentismo del alumno
│   │           ├── PreceptoriaTomaAsistenciaView.tsx <-- Planilla diaria de toma de lista
│   │           ├── PreceptoriaConstanciasView.tsx    <-- Expedición de constancias
│   │           ├── PreceptoriaAlumnosView.tsx   <-- Nómina con filtros y rendimiento
│   │           ├── PreceptoriaRendimientoClasesView.tsx <-- Analítica por comisión
│   │           ├── AsistenciasDocenteView.tsx   <-- Asistencia personal de docentes
│   │           └── AdminAsistenciasDocentesView.tsx <-- Fiscalización del profesorado
│   │
│   └── edutech-oportunidades/                   <-- Plugin 2: Pasantías y Becas
│       ├── manifest.json                        <-- Metadatos y configuración
│       ├── backend/
│       │   ├── index.ts                         <-- Punto de entrada del microservicio
│       │   ├── database/setup_plugin_db.ts      <-- Esquema DDL de convocatorias
│       │   ├── services/oportunidades_service.ts<-- Reglas de postulación y cupos
│       │   ├── services/email_service.ts        <-- Notificaciones por correo
│       │   ├── controllers/oportunidades_controller.ts <-- Manejadores HTTP
│       │   └── routes/oportunidades_routes.ts   <-- Mapeo de rutas REST
│       └── frontend/
│           ├── services/oportunidades_api.ts    <-- Cliente HTTP Fetch tipado
│           ├── pages/OportunidadesPage.tsx      <-- Orquestador de vistas
│           ├── styles/oportunidades.module.css  <-- Estilos modulares espaciales
│           └── components/                      <-- Vistas de Exploración y Gestión
│               ├── OportunidadesExplorarView.tsx<-- Catálogo con filtros y modal
│               ├── MisPostulacionesView.tsx     <-- Seguimiento de postulaciones
│               └── GestionResponsableView.tsx   <-- Panel docente para evaluar aspirantes
```

---

## Tecnologías Principales Empleadas

- **Runtime y Lenguaje**: Node.js v22.x y TypeScript 5.x (Tipado estricto en cliente y servidor).
- **Backend**: Express.js, `express-session` con cookies seguras HttpOnly, `Socket.IO` para sincronización reactiva en tiempo real.
- **Base de Datos**: SQLite nativo canónico (`database/edutechhub.sql`) con soporte de adaptador universal para PostgreSQL.
- **Frontend**: React 18 / 19, React Router v6, CSS Modules encapsulados y arquitectura atómica orientada a componentes.
- **Seguridad**: Autenticación centralizada por sesión en memoria/base de datos, autorización basada en roles (RBAC) y sanitización estricta de parámetros SQL.
