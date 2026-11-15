# Casos de Prueba de Caja Negra — Aula Activa (Módulo Nativo)

## Resumen Ejecutivo de Testing
- **Módulo:** Aula Activa — Funcionalidad Nativa del Core de EduTech
- **Ruta Base:** `/api/aula-activa`
- **Total Casos de Prueba:** 10
- **Aprobadas:** 10
- **Fallidas:** 0
- **Bloqueadas:** 0

---

### CP-AA-01: Publicación de un trabajo práctico en clase asignada
- **Objetivo:** Verificar que un docente asignado a una clase pueda crear y publicar una actividad con título, consigna y fecha límite.
- **Precondiciones:** Docente autenticado con rol `profesor`, formalmente asignado a la clase ID 1 en `profesores_clases`.
- **Datos de Entrada:** `POST /api/aula-activa/clases/1/trabajos` con `{ "titulo": "TP 1: Algoritmos de Control", "descripcion": "Diseñar diagrama de estados", "fecha_limite": "2026-12-10" }`.
- **Resultado Esperado:** HTTP `201 Created` con el ID del trabajo y emisión de socket `aula_activa:nuevo_trabajo` a la sala de la clase.
- **Resultado Obtenido:** HTTP 201 Created con objeto creado y socket emitido.
- **Estado:** APROBADA.

---

### CP-AA-02: Bloqueo de publicación en clase NO asignada
- **Objetivo:** Validar que un docente no pueda publicar trabajos en comisiones donde no dicta cátedra.
- **Precondiciones:** Docente no asignado a la clase ID 99.
- **Datos de Entrada:** `POST /api/aula-activa/clases/99/trabajos`.
- **Resultado Esperado:** HTTP `403 Forbidden` por `verificarAccesoClase`.
- **Resultado Obtenido:** HTTP 403 Forbidden retornado correctamente.
- **Estado:** APROBADA.

---

### CP-AA-03: Consulta de trabajos por alumno matriculado
- **Objetivo:** Comprobar que un estudiante vea los trabajos prácticos de su clase con el estado correspondiente.
- **Precondiciones:** Alumno inscripto en la clase 1.
- **Datos de Entrada:** `GET /api/aula-activa/clases/1/trabajos`.
- **Resultado Esperado:** HTTP `200 OK` con la lista de trabajos prácticos de la comisión.
- **Resultado Obtenido:** HTTP 200 OK con la lista de actividades.
- **Estado:** APROBADA.

---

### CP-AA-04: Envío de entrega de trabajo práctico por el alumno
- **Objetivo:** Validar que un estudiante pueda enviar la resolución de una actividad antes del vencimiento.
- **Precondiciones:** Trabajo práctico ID 1 activo. Alumno matriculado.
- **Datos de Entrada:** `POST /api/aula-activa/trabajos/1/entregar` con `{ "contenido": "Resolución adjunta en repositorio GitHub", "archivo_url": "https://github.com/alumno/tp1" }`.
- **Resultado Esperado:** HTTP `200 OK`. Registro insertado en la tabla `entregas` con estado `'entregado'` y notificación al docente.
- **Resultado Obtenido:** HTTP 200 OK con entrega registrada.
- **Estado:** APROBADA.

---

### CP-AA-05: Calificación con nota >= 6 (Aprobado) sin feedback obligatorio
- **Objetivo:** Verificar que el docente pueda asignar una nota aprobatoria (ej. 8) con o sin devolución explicativa.
- **Precondiciones:** Docente asignado a la clase, entrega ID 5 en estado `'entregado'`.
- **Datos de Entrada:** `POST /api/aula-activa/entregas/5/calificar` con `{ "nota": 8, "feedback": "Excelente trabajo" }`.
- **Resultado Esperado:** HTTP `200 OK`. Entrega marcada con `nota: 8`, `estado: 'corregido'` y notificada al estudiante vía WebSocket.
- **Resultado Obtenido:** HTTP 200 OK con calificación registrada.
- **Estado:** APROBADA.

---

### CP-AA-06: Regla Estricta — Rechazo de nota < 6 SIN feedback pedagógico
- **Objetivo:** Comprobar que el sistema rechace de manera estricta cualquier calificación menor a 6 si no se provee un comentario pedagógico de devolución.
- **Precondiciones:** Docente asignado, entrega ID 6 pendiente.
- **Datos de Entrada:** `POST /api/aula-activa/entregas/6/calificar` con `{ "nota": 4, "feedback": "" }` (sin feedback o vacío).
- **Resultado Esperado:** HTTP `400 Bad Request` con mensaje `"Para notas inferiores a 6, es obligatorio proporcionar una devolución pedagógica (feedback) para orientar al alumno."`.
- **Resultado Obtenido:** HTTP 400 Bad Request bloqueando la operación por falta de feedback.
- **Estado:** APROBADA.

---

### CP-AA-07: Calificación con nota < 6 CON feedback pedagógico adecuado
- **Objetivo:** Validar que una calificación menor a 6 se guarde exitosamente cuando el docente incluye la devolución formativa requerida.
- **Precondiciones:** Docente asignado, entrega ID 6.
- **Datos de Entrada:** `POST /api/aula-activa/entregas/6/calificar` con `{ "nota": 4, "feedback": "Debes revisar los cálculos de potencia y volver a simular el circuito." }`.
- **Resultado Esperado:** HTTP `200 OK`. La entrega se guarda con `nota: 4`, la devolución pedagógica y el estado actualizado.
- **Resultado Obtenido:** HTTP 200 OK con devolución y nota almacenadas.
- **Estado:** APROBADA.

---

### CP-AA-08: Comunicación académica en tiempo real por clase
- **Objetivo:** Comprobar el envío y recepción de mensajes instantáneos en el muro de diálogo de la clase.
- **Precondiciones:** Alumno y docente conectados a la sala de la clase 1.
- **Datos de Entrada:** `POST /api/aula-activa/clases/1/mensajes` con `{ "contenido": "¿Se puede usar la librería NumPy en el TP?" }`.
- **Resultado Esperado:** HTTP `200 OK`. Mensaje persistido en `aula_activa_mensajes` y emitido vía `aula_activa:nuevo_mensaje` a todos los participantes conectados.
- **Resultado Obtenido:** HTTP 200 OK con broadcast en vivo.
- **Estado:** APROBADA.

---

### CP-AA-09: Métricas de rendimiento y entrega de la comisión
- **Objetivo:** Validar que el docente obtenga el resumen analítico de entregas, promedio y notas de la clase.
- **Precondiciones:** Clase con 10 alumnos, 8 entregaron (80%), notas promediando 7.5.
- **Datos de Entrada:** `GET /api/aula-activa/clases/1/metricas`.
- **Resultado Esperado:** HTTP `200 OK` con porcentaje de entrega calculado en 80%, distribución cualitativa y listado de alumnos que adeudan entrega.
- **Resultado Obtenido:** HTTP 200 OK con cálculo preciso en tiempo real.
- **Estado:** APROBADA.

---

### CP-AA-10: Edición y actualización de trabajo práctico existente
- **Objetivo:** Verificar que el docente creador pueda prorrogar la fecha límite o corregir la consigna de una actividad publicada.
- **Precondiciones:** Trabajo práctico ID 1 creado por el docente logueado.
- **Datos de Entrada:** `PUT /api/aula-activa/trabajos/1` con `{ "fecha_limite": "2026-12-20" }`.
- **Resultado Esperado:** HTTP `200 OK` con fecha límite actualizada.
- **Resultado Obtenido:** HTTP 200 OK con confirmación de actualización.
- **Estado:** APROBADA.
