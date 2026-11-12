# Arquitectura del Plugin — EduTech Aula Activa

## 1. Diseño por Capas
Aula Activa sigue el patrón arquitectónico en capas:
- **Capa de Presentación (Frontend):** React 19 + TypeScript + CSS Modules. Vistas desacopladas por rol (`AulaActivaDocenteView`, `AulaActivaAlumnoView`).
- **Capa de Controladores (Backend):** `AulaActivaController` expone los endpoints RESTful validando esquemas y formatos de entrada.
- **Capa de Middleware:** Control de autenticación de sesión y autorización por rol (`requireAuth`, `requireRoles`, `verificarAccesoClase`).
- **Capa de Servicios y Negocio:** `AulaActivaService` encapsula las reglas pedagógicas (validaciones de fecha límite, feedback obligatorio en notas < 6, emisión de eventos de socket).
- **Capa de Datos:** Adaptador PostgreSQL/SQLite ejecutando sentencias SQL con soporte transaccional e índices.

## 2. Bus de Comunicación en Tiempo Real
El plugin no implementa un servidor de sockets aislado, sino que se suscribe al bus unificado de la plataforma (`backend/socket_bus.ts`), canalizando los eventos a través de las salas de comisión (`clase_<id>`) y usuario (`user_<id>`).

