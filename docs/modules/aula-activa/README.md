# Módulo Nativo: Aula Activa — EduTech

## 1. Identificación del Módulo
- **Nombre:** Aula Activa
- **Tipo:** Funcionalidad Nativa del Core de EduTech (NO es un plugin)
- **Ubicación Backend:** `backend/services/aula_activa_service.ts`, `backend/controllers/aula_activa_controller.ts`, `backend/routes/aula_activa_routes.ts`
- **Ubicación Frontend:** `frontend/src/pages/AulaActiva.tsx`, `frontend/src/componentes/aula-activa/`, `frontend/src/services/aula_activa_api.ts`
- **Ruta Base API:** `/api/aula-activa`
- **Estado:** Activo e integrado en el núcleo de la plataforma

## 2. Propósito y Alcance
Digitalizar y centralizar el ciclo de enseñanza y aprendizaje entre docentes y alumnos mediante:
- Creación, modificación y archivo de trabajos prácticos (TPs) asociados a clases específicas.
- Entrega digital de actividades por parte de los alumnos con soporte para adjuntos y reintentos permitidos.
- Corrección pedagógica con sistema de calificaciones (1 a 10), estado de aprobación y devolución obligatoria cuando la calificación es inferior a 6 (para garantizar el acompañamiento y retroalimentación formativa).
- Tablero de métricas de rendimiento por clase en tiempo real (porcentajes de entrega, promedio de calificaciones, distribución cualitativa).
- Canal de mensajería académica contextual por clase con comunicación en tiempo real vía WebSockets (Socket.IO).

## 3. Integración en el Núcleo
A diferencia de los plugins modulares, Aula Activa forma parte de la arquitectura base de EduTech:
- Utiliza directamente la sesión del usuario (`req.session.usuario`).
- Valida autorizaciones con el sistema nativo de `verificarAccesoClase`.
- Se enlaza directamente con las tablas existentes `trabajos`, `entregas`, `clases`, `alumnos_clases`, `profesores_clases` y `notificaciones`.
- Utiliza el bus central de WebSockets (`socket_bus.ts`) con canales por clase (`emitToClass`) y usuario (`emitToUser`).
