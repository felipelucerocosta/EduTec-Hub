# Casos de Prueba de Caja Negra — EduTech Oportunidades

## Resumen de Ejecución
- **Total de Pruebas:** 10
- **Aprobadas:** 10
- **Fallidas:** 0
- **Bloqueadas:** 0

---

### CP-OP-01: Creación de una oportunidad válida
- **Objetivo:** Verificar que un responsable docente pueda crear una convocatoria institucional con todos los campos obligatorios.
- **Precondiciones:** Docente autenticado con rol `profesor` o `admin`.
- **Datos de Entrada:** `titulo`: "Pasantía en Robótica y PLC", `institucion`: "Tech Automation S.A.", `descripcion`: "Programación de controladores industriales", `categoria`: "robotica_automatizacion", `vacantes_totales`: 2, `fecha_cierre_inscripcion`: "2026-12-31".
- **Pasos:**
  1. Enviar `POST /api/plugins/oportunidades/oportunidades`.
  2. Verificar respuesta y almacenamiento en base de datos.
- **Resultado Esperado:** Código HTTP 201 Created, ID autoincremental asignado y evento `opportunity.created` emitido.
- **Resultado Obtenido:** 201 Created con ID persistido.
- **Estado:** APROBADA
- **Evidencia:** Registro en `plugin_oportunidades` con estado `abierta`.

---

### CP-OP-02: Publicación con fechas y cantidad de vacantes
- **Objetivo:** Comprobar que no se puedan crear convocatorias con vacantes menores o iguales a cero.
- **Precondiciones:** Docente autenticado.
- **Datos de Entrada:** `vacantes_totales`: 0.
- **Pasos:**
  1. Enviar solicitud de creación con `vacantes_totales: 0`.
- **Resultado Esperado:** HTTP 400 o 500 informando que la cantidad de vacantes debe ser mayor a 0.
- **Resultado Obtenido:** Error: "La cantidad de vacantes totales debe ser mayor a 0."
- **Estado:** APROBADA
- **Evidencia:** Validación en `OportunidadesService.crearOportunidad` previene la inserción.

---

### CP-OP-03: Inscripción correcta de un estudiante
- **Objetivo:** Verificar que un alumno matriculado pueda postularse a una convocatoria abierta.
- **Precondiciones:** Oportunidad con vacantes disponibles y fecha vigente; sesión de alumno iniciada.
- **Datos de Entrada:** `POST /api/plugins/oportunidades/oportunidades/1/postular`, `motivacion`: "Deseo perfeccionar mis habilidades en PLC".
- **Pasos:**
  1. Alumno envía postulación.
  2. Verificar inserción en `plugin_oportunidades_postulaciones`.
- **Resultado Esperado:** HTTP 201 Created, postulación en estado `pendiente`, correo enviado al responsable y socket emitido.
- **Resultado Obtenido:** 201 Created, postulación persistida y correo preparado.
- **Estado:** APROBADA
- **Evidencia:** Objeto devuelto: `{ success: true, message: "¡Te has postulado con éxito!..." }`.

---

### CP-OP-04: Rechazo de inscripciones duplicadas
- **Objetivo:** Impedir que el mismo estudiante se postule dos veces a la misma oportunidad.
- **Precondiciones:** Alumno ya postulado previamente a la oportunidad 1.
- **Datos de Entrada:** Petición POST idéntica para la oportunidad 1.
- **Pasos:**
  1. Reintentar postulación con el mismo ID de alumno y oportunidad.
- **Resultado Esperado:** HTTP 400 Bad Request indicando postulación previa.
- **Resultado Obtenido:** HTTP 400: "Ya posees una postulación registrada para esta oportunidad."
- **Estado:** APROBADA
- **Evidencia:** Restricción UNIQUE en base de datos y chequeo previo en servicio.

---

### CP-OP-05: Rechazo de inscripciones posteriores a la fecha de cierre
- **Objetivo:** Comprobar que no se admitan inscripciones en convocatorias cuya fecha de cierre ya haya transcurrido.
- **Precondiciones:** Oportunidad con `fecha_cierre_inscripcion` anterior a la fecha actual.
- **Datos de Entrada:** Petición POST de postulación.
- **Pasos:**
  1. Alumno intenta postularse a la convocatoria vencida.
- **Resultado Esperado:** HTTP 400 informando que la convocatoria está cerrada o expirada.
- **Resultado Obtenido:** HTTP 400: "La fecha límite para inscribirse en esta oportunidad ha expirado."
- **Estado:** APROBADA
- **Evidencia:** Función `actualizarVigencias` actualiza estado a `cerrada` y bloquea la operación.

---

### CP-OP-06: Control de vacantes al alcanzar el límite máximo
- **Objetivo:** Impedir la aceptación de más postulantes cuando las vacantes ocupadas igualan a las vacantes totales.
- **Precondiciones:** Convocatoria con `vacantes_totales: 1` y `vacantes_ocupadas: 1`.
- **Datos de Entrada:** Responsable intenta pasar una segunda postulación al estado `aceptada`.
- **Pasos:**
  1. `PUT /api/plugins/oportunidades/postulaciones/2/estado` con `{ estado: "aceptada" }`.
- **Resultado Esperado:** HTTP 400 Bad Request indicando cupo de vacantes agotado.
- **Resultado Obtenido:** Error: "No se puede aceptar al postulante: la convocatoria ya completó todas sus vacantes."
- **Estado:** APROBADA
- **Evidencia:** Chequeo en `actualizarEstadoPostulacion` protege el cupo de vacantes.

---

### CP-OP-07: Notificación al responsable con el nombre y correo del estudiante
- **Objetivo:** Validar que el responsable reciba los datos de contacto del alumno en el correo y notificación interna.
- **Precondiciones:** Alumno con nombre "Juan Pérez" y correo "alumno1@edutechhub.edu.ar".
- **Datos de Entrada:** Postulación enviada por el alumno.
- **Pasos:**
  1. Ejecutar postulación.
  2. Verificar payload despachado a `EmailOportunidadesService` y tabla `notificaciones`.
- **Resultado Esperado:** El correo generado incluye el nombre completo del estudiante, su correo electrónico oficial, la convocatoria y su motivación.
- **Resultado Obtenido:** Correo estructurado con plantilla HTML y texto plano; notificación interna persistida para el `responsable_id`.
- **Estado:** APROBADA
- **Evidencia:** Logs y registro en tabla `notificaciones`.

---

### CP-OP-08: Aceptación o rechazo de una postulación por un responsable autorizado
- **Objetivo:** Verificar que el docente responsable pueda evaluar candidatos y actualizar su estado.
- **Precondiciones:** Postulación en estado `pendiente`.
- **Datos de Entrada:** `PUT /api/plugins/oportunidades/postulaciones/:id/estado`, `estado`: "aceptada", `notas`: "Cumple con el perfil de automatización".
- **Pasos:**
  1. Docente envía actualización de estado.
  2. Verificar actualización de `vacantes_ocupadas` y estado de la postulación.
- **Resultado Esperado:** Estado de postulación pasa a `aceptada`, `vacantes_ocupadas` se incrementa en 1, notificación al alumno y socket `application.accepted`.
- **Resultado Obtenido:** Base de datos refleja `vacantes_ocupadas = 1` y postulación `aceptada`.
- **Estado:** APROBADA
- **Evidencia:** Petición GET devuelve estado `aceptada` con notas del responsable.

---

### CP-OP-09: Restricción de acceso y edición a responsables no autorizados
- **Objetivo:** Garantizar que un docente no pueda modificar convocatorias pertenecientes a otra institución o responsable sin ser administrador.
- **Precondiciones:** Oportunidad creada por el usuario ID 5; sesión iniciada con docente ID 6.
- **Datos de Entrada:** `PUT /api/plugins/oportunidades/oportunidades/1` con sesión de docente ajeno.
- **Pasos:**
  1. Enviar solicitud de modificación.
- **Resultado Esperado:** HTTP 403 Forbidden por falta de permisos sobre la convocatoria.
- **Resultado Obtenido:** HTTP 403 Forbidden: "No tienes autorización para editar esta convocatoria."
- **Estado:** APROBADA
- **Evidencia:** Controlador valida `op.responsable_id === usuario.id || esAdmin`.

---

### CP-OP-10: Actualización en tiempo real y persistencia tras desconexión
- **Objetivo:** Comprobar que las acciones emitan eventos WebSocket y se recuperen correctamente mediante REST al recargar la página.
- **Precondiciones:** Cliente conectado al socket bus.
- **Datos de Entrada:** Publicación de oportunidad y postulación de alumno.
- **Pasos:**
  1. Monitorear eventos `opportunity.created`, `application.created` y `application.status_updated`.
  2. Simular recarga del cliente (petición GET `/oportunidades` y `/mis-postulaciones`).
- **Resultado Esperado:** Eventos socket recibidos en tiempo real y datos idénticos obtenidos tras la reconexión vía API REST.
- **Resultado Obtenido:** Coherencia total entre eventos de socket y persistencia en SQLite.
- **Estado:** APROBADA
- **Evidencia:** Endpoints REST devuelven el estado exacto emitido previamente en los sockets.

