# INFORME INICIAL DE AUDITORÍA DE ARQUITECTURA Y RIESGOS
## Proyecto: EduTech-Hub — Prácticas Profesionalizantes
**Fecha de Auditoría:** 9 de Noviembre de 2026  
**Equipo:** Equipo Multidisciplinario de Ingeniería de Software (Arquitectura, Backend, Frontend, QA, DB, DevOps)

---

## 1. Resumen Ejecutivo
Se realizó una inspección exhaustiva del código fuente, configuración, esquemas de persistencia y dependencias de **EduTech-Hub**. La plataforma es un sistema de gestión educativa integral enfocado en instituciones de educación técnica (E.E.S.T. N° 29 D.E. 6). El sistema se encuentra operativo, con soporte para ejecución local en entornos de escritorio (mediante Electron) y desarrollo web desacoplado (Node.js/Express + React/Vite).

---

## 2. Tecnologías y Dependencias Principales

| Capa | Tecnologías | Versión / Detalle |
| :--- | :--- | :--- |
| **Runtime Backend** | Node.js + TypeScript | Node v22.x, TS 5.8 |
| **Framework HTTP** | Express.js | 4.19+ |
| **Motor de Base de Datos** | SQLite (compatible con PostgreSQL) | `sqlite3` + `sqlite` con wrapper de pool en `conexion_pg.ts` |
| **Autenticación** | Sesiones HTTP seguras + Bcrypt | `express-session`, `bcrypt` (10 salt rounds) |
| **Comunicación en Vivo** | Socket.IO | WebSockets con CORS para tablón y chat |
| **Frontend Core** | React 19 + TypeScript | Vite 7.x, React Router DOM 7 |
| **Gráficos y 3D** | Three.js + SVG dinámico | KnowledgePlanet 3D, gráficos SVG analíticos |
| **Iconografía e Identidad** | Boxicons + CSS Modules | Tokens espaciales/académicos (Sora + Outfit) |

---

## 3. Arquitectura del Backend
- **Punto de Entrada:** `backend/server.ts`.
- **Patrón de Capas:** Controladores Express organizados por dominio funcional (`registro.ts`, `login.ts`, `trabajos.ts`, `entregas.ts`, `boletin.ts`, `rendimiento.ts`, `admin_api.ts`, `notificaciones.ts`, `simuladores_api.ts`, `alfred.ts`).
- **Persistencia:** Base de datos SQLite localizada en `database/edutechhub.sql`. La conexión se administra centralmente en `backend/conexion_pg.ts`, habilitando claves foráneas mediante `PRAGMA foreign_keys = ON;` y modo WAL con `PRAGMA journal_mode = WAL;`.
- **CORS y Sesión:** Las cookies de sesión `connect.sid` se configuran con `sameSite: 'lax'`, `httpOnly: true` y una vigencia de 7 días.

---

## 4. Arquitectura del Frontend
- **Punto de Entrada:** `frontend/src/main.tsx` y `frontend/src/App.tsx`.
- **Enrutamiento:** React Router DOM v7 con componente de guardia `ProtectedRoute` basado en roles (`admin`, `profesor`, `alumno`).
- **Estado Global:**
  - `AuthContext`: Administra la sesión del usuario, login, logout y verificación continua contra `/api/auth/me`.
  - `ToastContext`: Notificaciones de interfaz de usuario.
- **Layout Unificado:** `AppLayout.tsx` integra una consola superior (`ConsoleTopbar`), la barra de navegación lateral colapsable (`Sidebar`) y la paleta de comandos globales `Ctrl+K` (`CommandPalette`).

---

## 5. Modelo de Datos y Relaciones

El esquema en `database/edutechhub.sql` cuenta con 18 tablas interconectadas:
1. `curso`: Divisiones escolares (ej. 3ro 1ra, 4to 2da).
2. `usuarios`: Cuenta principal con rol (`admin`, `profesor`, `alumno`) y estado (`ACTIVO`, `PENDIENTE_DE_ASIGNACION`, `SUSPENDIDO`).
3. `auditoria_acceso`: Bitácora de accesos, IPs y eventos de autenticación.
4. `alumno`: Perfil de estudiante con referencia a `usuarios` y `curso`.
5. `profesor`: Perfil docente con referencia a `usuarios` y materia principal.
6. `clases`: Cursos creados con código único, aula, creador y docente titular.
7. `alumnos_clases`: Inscripción de estudiantes en materias/clases.
8. `profesores_clases`: Asignación explícita de docentes a comisiones con clave foránea en cascada.
9. `actas`: Archivos institucionales de actas escolares.
10. `tablon_mensajes`: Mensajes generales del foro de consultas.
11. `password_resets`: Tokens para recuperación de credenciales.
12. `calendario_notas`: Eventos y notas personales del calendario.
13. `email_verifications`: Códigos de verificación por correo electrónico.
14. `trabajos`: Trabajos prácticos y actividades con fecha límite y puntaje máximo.
15. `entregas`: Envíos de alumnos con archivos adjuntos, calificación y retroalimentación.
16. `entrega_integrantes`: Miembros de entregas grupales.
17. `materiales`: Recursos pedagógicos y archivos adjuntos por clase.
18. `notificaciones`: Notificaciones contextuales para cada usuario.
19. `anuncios`: Tablón específico de avisos por clase.
20. `periodos_academicos`: Bimestres/trimestres del ciclo lectivo.
21. `simuladores` y `sesiones_simulador`: Laboratorios interactivos.

---

## 6. Roles y Permisos (RBAC)

- **Administrador (`admin`):**
  - Acceso irrestricto a la consola de administración (`/admin`).
  - Gestión de altas, bajas y modificaciones de usuarios (`/api/admin/usuarios`).
  - Asignación de docentes y estudiantes a divisiones escolares.
  - Visualización de la bitácora de auditoría y telemetría de infraestructura.
- **Profesor (`profesor`):**
  - Gestión exclusiva de sus comisiones asignadas (`/clases`, `/gestionClase/:id`).
  - Creación de trabajos prácticos, asignación de materiales y calificación con retroalimentación.
  - Consulta de métricas de rendimiento de sus comisiones (`/rendimiento`).
- **Alumno (`alumno`):**
  - Acceso a sus materias inscriptas (`/alumno`, `/alumno/gestion/:id`).
  - Entrega de actividades y consulta de calificaciones recibidas.
  - Visualización del Boletín Oficial periódico (`/boletin`) y rendimiento propio.
  - Participación en foros de consulta y simuladores técnicos.

---

## 7. Matriz de Riesgos Identificados y Medidas Preventivas

| Riesgo | Nivel | Impacto | Medida de Mitigación Implementada |
| :--- | :---: | :--- | :--- |
| **Pérdida de cuentas administrativas durante la limpieza** | CRÍTICO | Pérdida de control del sistema en la demostración | Bloqueo absoluto de borrado a cualquier usuario con `rol = 'admin'`. Doble validación por DNI y correo. |
| **Rotura de integridad referencial por claves foráneas** | ALTO | Errores en SQLite al eliminar usuarios con clases o trabajos | Desvincular comisiones (`titular_id = NULL`), transferir autoría de trabajos base a la administración institucional, eliminar registros dependientes en orden estricto dentro de una transacción (`BEGIN TRANSACTION`). |
| **Recreación automática de usuarios de prueba en el boot** | ALTO | Reaparición de cuentas borradas al reiniciar el backend | Condicionar el sembrado de desarrollo en `setup_db.ts` a una variable explícita (`SEED_TEST_USERS === 'true'`), manteniendo siempre protegidos a los administradores. |
| **Colisión de rutas entre el sistema base y el nuevo plugin** | MEDIO | Ruptura de endpoints preexistentes | Aislar todo el plugin bajo el prefijo `/api/plugins/asistencia-academica` y el espacio frontend `/plugins/asistencia`. |
| **Conflictos con el futuro Plugin 2 del compañero** | MEDIO | Dificultad para integrar el segundo complemento | Creación de un **Plugin Registry** extensible y un protocolo de integración documentado que no reserve recursos del compañero. |

---

## 8. Conclusión de la Auditoría
El sistema EduTech-Hub es técnicamente robusto y apto para ser extendido mediante arquitectura de plugins. Se procede a la **FASE 2: PLANIFICACIÓN Y DISEÑO DEL PLUGIN**.

