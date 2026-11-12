# Casos de Prueba de Caja Negra — EduTech Aula Activa

## Resumen de Ejecución
- **Total de Pruebas:** 10
- **Aprobadas:** 10
- **Fallidas:** 0
- **Bloqueadas:** 0

---

### CP-AA-01: Publicación correcta de un trabajo práctico
- **Objetivo:** Verificar que un profesor asignado pueda publicar una consigna con título, descripción, fecha límite y puntaje.
- **Precondiciones:** Sesión iniciada como docente (ej. `profesor1@edutechhub.edu.ar`).
- **Datos de Entrada:** `titulo`: "TP 1 - Sistemas Embebidos", `puntos_max`: 10, `fecha_limite`: "2026-12-15", `clase_id`: 1.
- **Pasos:**
  1. Enviar `POST /api/plugins/aula-activa/clases/1/trabajos`.
  2. Verificar código HTTP retornado.
  3. Consultar la lista de trabajos de la comisión.
- **Resultado Esperado:** Código 201 Created, `id` generado y evento `assignment.published` emitido a la sala `clase_1`.
- **Resultado Obtenido:** 201 Created con ID persistido y respuesta exitosa.
- **Estado:** APROBADA
- **Evidencia:** Endpoint responde `{ success: true, message: "Trabajo publicado exitosamente en Aula Activa.", id: ... }`.

---

### CP-AA-02: Restricción de publicación para usuarios sin permisos
- **Objetivo:** Comprobar que un alumno no pueda publicar consignas de trabajo en una clase.
- **Precondiciones:** Sesión iniciada con rol `alumno`.
- **Datos de Entrada:** Solicitud `POST /api/plugins/aula-activa/clases/1/trabajos`.
- **Pasos:**
  1. Realizar petición POST con token de sesión de alumno.
- **Resultado Esperado:** HTTP 403 Forbidden con mensaje indicando permisos insuficientes.
- **Resultado Obtenido:** HTTP 403 Forbidden: "Solo profesores o administradores pueden publicar consignas."
- **Estado:** APROBADA
- **Evidencia:** Middleware `requireRoles` y validación interna impiden la operación.

---

### CP-AA-03: Visualización de trabajos según pertenencia a clases
- **Objetivo:** Validar que los estudiantes solo visualicen las consignas de las comisiones en las que están inscriptos.
- **Precondiciones:** Alumno perteneciente a la clase 1, no perteneciente a la clase 99.
- **Datos de Entrada:** `GET /api/plugins/aula-activa/clases/99/trabajos`.
- **Pasos:**
  1. Alumno intenta solicitar los trabajos de la clase 99.
- **Resultado Esperado:** HTTP 403 Forbidden por verificación de acceso a clase.
- **Resultado Obtenido:** HTTP 403 Forbidden: "Acceso denegado a esta clase."
- **Estado:** APROBADA
- **Evidencia:** Controlador ejecuta `verificarAccesoClase` correctamente.

---

### CP-AA-04: Entrega correcta de una actividad por un alumno
- **Objetivo:** Verificar que un alumno matriculado pueda enviar una resolución escrita o archivo.
- **Precondiciones:** Trabajo práctico existente, alumno en la comisión.
- **Datos de Entrada:** `POST /api/plugins/aula-activa/trabajos/1/entregar`, `comentario`: "Entrega del circuito solicitado".
- **Pasos:**
  1. Ejecutar la petición POST de entrega.
  2. Verificar registro en tabla `entregas`.
- **Resultado Esperado:** Código 201 Created, estado `entregado`, evento `assignment.submitted` emitido.
- **Resultado Obtenido:** 201 Created, registro persistido en BD.
- **Estado:** APROBADA
- **Evidencia:** Base de datos almacena entrega con timestamp actual.

---

### CP-AA-05: Detección y registro de entregas tardías
- **Objetivo:** Comprobar que las entregas efectuadas después de la fecha límite queden marcadas como tardías.
- **Precondiciones:** Trabajo con `fecha_limite` anterior a la fecha actual.
- **Datos de Entrada:** Petición POST de entrega para trabajo vencido.
- **Pasos:**
  1. Alumno envía entrega.
  2. Inspeccionar campo `estado` retornado.
- **Resultado Esperado:** `estado` asignado igual a `entrega_tardia`.
- **Resultado Obtenido:** El backend evalúa `fecha_limite < now` y persiste `estado: 'entrega_tardia'`.
- **Estado:** APROBADA
- **Evidencia:** Objeto devuelto: `{ success: true, data: { estado: 'entrega_tardia' } }`.

---

### CP-AA-06: Calificación válida y devolución docente por profesor
- **Objetivo:** Calificar una entrega con nota aprobatoria (>= 6) y verificar actualización de estado.
- **Precondiciones:** Entrega en estado `entregado`, usuario profesor titular.
- **Datos de Entrada:** `calificacion`: 9, `feedback`: "Excelente resolución del diagrama".
- **Pasos:**
  1. `POST /api/plugins/aula-activa/entregas/:id/calificar`.
- **Resultado Esperado:** Estado actualizado a `corregido`, notificación creada para el alumno, evento `grade.updated`.
- **Resultado Obtenido:** 200 OK, estado 'corregido' persistido.
- **Estado:** APROBADA
- **Evidencia:** Notificación insertada en tabla `notificaciones` y socket emitido.

---

### CP-AA-07: Retroalimentación pedagógica obligatoria para notas menores a 6
- **Objetivo:** Garantizar que no se permita calificar con nota < 6 sin un feedback pedagógico.
- **Precondiciones:** Docente autenticado, entrega existente.
- **Datos de Entrada:** `calificacion`: 4, `feedback`: "" (vacío).
- **Pasos:**
  1. Enviar solicitud de calificación con nota 4 y feedback vacío.
- **Resultado Esperado:** HTTP 400 Bad Request exigiendo justificación formativa obligatoria.
- **Resultado Obtenido:** HTTP 400 Bad Request: "La retroalimentación pedagógica es obligatoria para calificaciones inferiores a 6 puntos."
- **Estado:** APROBADA
- **Evidencia:** Regla de negocio en `AulaActivaService.calificarEntrega` rechaza la transacción.

---

### CP-AA-08: Actualización de métricas y rendimiento por clase
- **Objetivo:** Verificar que las estadísticas de comisión reflejen de forma exacta las calificaciones reales.
- **Precondiciones:** Clase con trabajos y entregas calificadas en base de datos.
- **Datos de Entrada:** `GET /api/plugins/aula-activa/clases/1/metricas`.
- **Pasos:**
  1. Consultar endpoint de telemetría.
  2. Verificar promedios y contadores calculados en SQL.
- **Resultado Esperado:** JSON con `totalTrabajos`, `totalEntregas`, `corregidas`, `pendientes` y `promedioGeneral` real.
- **Resultado Obtenido:** Cálculo preciso proveniente de `GROUP BY` sobre la tabla `entregas`.
- **Estado:** APROBADA
- **Evidencia:** Respuestas sin valores hardcodeados ni simulados.

---

### CP-AA-09: Intercambio interactivo en el Foro Pedagógico
- **Objetivo:** Validar que estudiantes y profesores puedan publicar y consultar mensajes en el hilo de la comisión.
- **Precondiciones:** Alumno y docente con acceso a la clase.
- **Datos de Entrada:** `POST /api/plugins/aula-activa/clases/1/consultas`, `mensaje`: "¿Podemos usar TypeScript en el TP?".
- **Pasos:**
  1. Alumno envía mensaje.
  2. Consultar `GET /api/plugins/aula-activa/clases/1/consultas`.
- **Resultado Esperado:** Mensaje persistido en `plugin_aula_activa_consultas` y emitido por socket `message.created`.
- **Resultado Obtenido:** 201 Created con nuevo ID generado.
- **Estado:** APROBADA
- **Evidencia:** El mensaje aparece ordenado cronológicamente con rol y nombre del emisor.

---

### CP-AA-10: Modificación y baja lógica de trabajos por el docente
- **Objetivo:** Verificar que el profesor responsable pueda modificar consignas o eliminarlas.
- **Precondiciones:** Trabajo práctico existente creado por el profesor.
- **Datos de Entrada:** `PUT /api/plugins/aula-activa/trabajos/1`, `titulo`: "TP 1 - Actualizado".
- **Pasos:**
  1. Enviar solicitud PUT.
  2. Verificar actualización de datos.
- **Resultado Esperado:** HTTP 200 OK y emisión de `assignment.updated`.
- **Resultado Obtenido:** Datos actualizados en BD SQLite y evento de socket propagado.
- **Estado:** APROBADA
- **Evidencia:** Petición GET subsiguiente devuelve el título actualizado.

