# Arquitectura de Aula Activa (Módulo Nativo)

```
+-------------------------------------------------------------------------------+
|                                  EDUTECH CORE                                 |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [ FRONTEND ]                                                                 |
|  - Pages: frontend/src/pages/AulaActiva.tsx                                   |
|  - Components: frontend/src/componentes/aula-activa/                          |
|      * AulaActivaDocenteView.tsx                                              |
|      * AulaActivaAlumnoView.tsx                                               |
|      * aula_activa.module.css                                                 |
|  - Services: frontend/src/services/aula_activa_api.ts                          |
|                                                                               |
|                                  | HTTP / JSON & WebSocket (Socket.IO)        |
|                                  v                                            |
|                                                                               |
|  [ BACKEND CORE ]                                                             |
|  - Mount Point: /api/aula-activa (backend/server.ts)                          |
|  - Routes: backend/routes/aula_activa_routes.ts                               |
|  - Controller: backend/controllers/aula_activa_controller.ts                  |
|  - Service: backend/services/aula_activa_service.ts                           |
|  - Authorization: backend/permisos.ts (verificarAccesoClase)                  |
|  - Real-Time Bus: backend/socket_bus.ts (emitToClass, emitToUser)             |
|                                                                               |
|                                  | SQL Queries                                |
|                                  v                                            |
|                                                                               |
|  [ DATABASE LAYER ]                                                           |
|  - Adapter: backend/conexion_pg.ts (SQLite Driver compatible con PG interface)|
|  - Core Tables:                                                               |
|      * trabajos (id, titulo, descripcion, clase_id, fecha_limite, ...)        |
|      * entregas (id, trabajo_id, alumno_id, fecha_entrega, nota, feedback...) |
|      * clases (id, nombre, seccion, materia...)                               |
|      * alumnos_clases (alumno_id, clase_id)                                   |
|      * profesores_clases (profesor_id, clase_id)                              |
|      * notificaciones (id, usuario_id, mensaje, leido, fecha)                 |
|                                                                               |
+-------------------------------------------------------------------------------+
```

## Justificación de Integración Nativa
1. **No es un plugin:** La gestión de trabajos y entregas es el núcleo formativo del LMS (Learning Management System). Separarlo en un plugin crearía dependencias cruzadas indeseables con el boletín y la administración de cursos.
2. **Cohesión de datos:** Los datos de notas alimentan directamente el cálculo del boletín académico y las alertas tempranas.
3. **Mantenibilidad:** El código reside directamente en las carpetas canónicas del backend y frontend sin necesidad de ciclo de vida de instalación/desinstalación.
