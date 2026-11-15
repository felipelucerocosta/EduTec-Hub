# Casos de Prueba de Caja Negra — EduTech Preceptoría (Plugin 1)

## Resumen Ejecutivo de Testing
- **Módulo:** Plugin EduTech Preceptoría (`edutech-preceptoria`)
- **Enfoque:** Pruebas funcionales de caja negra, validación de permisos de rol estricto y concurrencia.
- **Total Casos de Prueba:** 10
- **Aprobadas:** 10
- **Fallidas:** 0
- **Bloqueadas:** 0

---

### CP-PRE-01: Listado de clases asignadas al preceptor
- **Objetivo:** Verificar que un usuario con rol `preceptor` consulte exitosamente las clases que le han sido asignadas por el administrador.
- **Precondiciones:** Usuario preceptor autenticado (`preceptor_id = 4`), asignado a las clases ID 1 y 2 en la tabla `preceptores_clases`.
- **Datos de Entrada:** Petición `GET /api/plugins/edutech-preceptoria/mis-clases`.
- **Pasos:**
  1. Iniciar sesión con credenciales de preceptor.
  2. Ejecutar la solicitud GET al endpoint `/mis-clases`.
- **Resultado Esperado:** Código HTTP `200 OK`. Retorna un array con las clases ID 1 y 2, incluyendo nombre, división y cantidad de alumnos matriculados.
- **Resultado Obtenido:** HTTP 200 OK con la lista correspondiente a las clases asignadas.
- **Estado:** APROBADA.

---

### CP-PRE-02: Registro de asistencia diaria por parte del preceptor asignado
- **Objetivo:** Validar que el preceptor pueda registrar la asistencia de una jornada completa para los alumnos de su clase asignada.
- **Precondiciones:** Preceptor asignado a la clase 1. Fecha: `2026-11-15`.
- **Datos de Entrada:** `POST /api/plugins/edutech-preceptoria/clases/1/asistencia` con body:
  ```json
  {
    "fecha": "2026-11-15",
    "observaciones": "Jornada habitual",
    "registros": [
      { "alumno_id": 10, "estado": "presente" },
      { "alumno_id": 11, "estado": "ausente", "observacion": "Sin aviso" }
    ]
  }
  ```
- **Pasos:**
  1. Enviar solicitud POST con el payload de asistencia.
  2. Verificar persistencia en base de datos.
- **Resultado Esperado:** Código HTTP `200 OK`. Se crea la sesión en `plugin_preceptoria_sesiones` y los registros en `plugin_preceptoria_registros`.
- **Resultado Obtenido:** HTTP 200 OK con confirmación y `sesion_id` generado.
- **Estado:** APROBADA.

---

### CP-PRE-03: Bloqueo estricto — Administrador intenta registrar asistencia
- **Objetivo:** Comprobar la regla de exclusividad funcional: el rol `admin` NO puede registrar asistencias directamente.
- **Precondiciones:** Sesión iniciada con usuario de rol `admin`.
- **Datos de Entrada:** Solicitud `POST /api/plugins/edutech-preceptoria/clases/1/asistencia` con payload válido de asistencia.
- **Pasos:**
  1. Autenticar como administrador.
  2. Intentar ejecutar el POST de registro de asistencia.
- **Resultado Esperado:** Código HTTP `403 Forbidden` con mensaje `"Acceso denegado: La toma de asistencia es una potestad exclusiva del rol preceptor."`.
- **Resultado Obtenido:** HTTP 403 Forbidden retornado por el middleware `requireExclusivoPreceptor`.
- **Estado:** APROBADA.

---

### CP-PRE-04: Bloqueo estricto — Docente o Alumno intentan registrar asistencia
- **Objetivo:** Comprobar que docentes y alumnos no pueden enviar asistencias bajo ninguna circunstancia.
- **Precondiciones:** Sesión con rol `profesor` o `alumno`.
- **Datos de Entrada:** `POST /api/plugins/edutech-preceptoria/clases/1/asistencia`.
- **Pasos:**
  1. Enviar petición POST autenticado como docente.
- **Resultado Esperado:** Código HTTP `403 Forbidden`.
- **Resultado Obtenido:** HTTP 403 Forbidden denegado por middleware de rol exclusivo.
- **Estado:** APROBADA.

---

### CP-PRE-05: Preceptor intenta registrar asistencia en una clase NO asignada
- **Objetivo:** Validar que un preceptor no pueda tomar asistencia en cursos donde no tiene asignación institucional.
- **Precondiciones:** Preceptor asignado a la clase 1, pero NO asignado a la clase 99.
- **Datos de Entrada:** `POST /api/plugins/edutech-preceptoria/clases/99/asistencia`.
- **Pasos:**
  1. Preceptor intenta enviar asistencia para la clase 99.
- **Resultado Esperado:** Código HTTP `403 Forbidden` con mensaje indicando falta de asignación a dicha clase.
- **Resultado Obtenido:** HTTP 403 Forbidden por middleware `requirePreceptorAsignadoAClase`.
- **Estado:** APROBADA.

---

### CP-PRE-06: Rectificación de asistencia para una fecha ya registrada
- **Objetivo:** Validar que al reenviar asistencia para una misma fecha y clase, el sistema actualice los estados sin duplicar la sesión.
- **Precondiciones:** Ya existe una sesión de asistencia para la fecha `2026-11-15` en la clase 1.
- **Datos de Entrada:** `POST /api/plugins/edutech-preceptoria/clases/1/asistencia` cambiando el alumno 11 de "ausente" a "justificado" con nota "Certificado médico presentado".
- **Pasos:**
  1. Enviar POST con el estado rectificado.
  2. Consultar `GET /api/plugins/edutech-preceptoria/clases/1/asistencia?fecha=2026-11-15`.
- **Resultado Esperado:** HTTP 200 OK. La sesión se actualiza en lugar de duplicarse, y el alumno 11 figura como `justificado`.
- **Resultado Obtenido:** HTTP 200 OK. Registro actualizado exitosamente con timestamp `actualizado_en`.
- **Estado:** APROBADA.

---

### CP-PRE-07: Asignación de clase por parte del Administrador
- **Objetivo:** Verificar que el administrador institucional pueda vincular un preceptor a una clase.
- **Precondiciones:** Sesión iniciada como `admin`. Preceptor ID 5 y Clase ID 3 sin vínculo previo.
- **Datos de Entrada:** `POST /api/plugins/edutech-preceptoria/admin/asignaciones` con `{ "preceptor_id": 5, "clase_id": 3 }`.
- **Pasos:**
  1. Enviar petición POST de asignación.
- **Resultado Esperado:** Código HTTP `201 Created`. Se inserta el registro en la tabla `preceptores_clases`.
- **Resultado Obtenido:** HTTP 201 Created con el vínculo confirmado.
- **Estado:** APROBADA.

---

### CP-PRE-08: Revocación de asignación de clase por el Administrador
- **Objetivo:** Comprobar que el administrador pueda desvincular a un preceptor de una clase.
- **Precondiciones:** Existe asignación con ID 12 en `preceptores_clases`.
- **Datos de Entrada:** `DELETE /api/plugins/edutech-preceptoria/admin/asignaciones/12`.
- **Pasos:**
  1. Administrador envía petición DELETE.
- **Resultado Esperado:** Código HTTP `200 OK`. El preceptor pierde acceso inmediato a la toma de asistencia en esa clase.
- **Resultado Obtenido:** HTTP 200 OK. Registro eliminado.
- **Estado:** APROBADA.

---

### CP-PRE-09: Cálculo de estadísticas y alerta de presentismo crítico (< 75%)
- **Objetivo:** Validar que el endpoint de estadísticas identifique correctamente a los alumnos en riesgo de pérdida de regularidad.
- **Precondiciones:** Alumno con 10 clases registradas: 6 presentes, 4 ausentes (60% de presentismo).
- **Datos de Entrada:** `GET /api/plugins/edutech-preceptoria/clases/1/estadisticas`.
- **Pasos:**
  1. Solicitar estadísticas de la clase.
- **Resultado Esperado:** HTTP 200 OK. El alumno aparece listado en la sección de `alumnos_en_riesgo` con porcentaje `60.0%` y estado de alerta activo.
- **Resultado Obtenido:** HTTP 200 OK con cálculo exacto y alerta detectada.
- **Estado:** APROBADA.

---

### CP-PRE-10: Operación por lote — Marcar Todos Presentes
- **Objetivo:** Validar en la interfaz de frontend que la acción rápida "Marcar Todos Presentes" asigne el estado `presente` a la totalidad de la nómina de alumnos matriculados.
- **Precondiciones:** Vista de toma de asistencia cargada con 25 alumnos.
- **Pasos:**
  1. Hacer clic en el botón "Marcar Todos Presentes".
  2. Verificar que los 25 chips de estado cambien a verde (Presente).
  3. Presionar "Guardar Asistencia".
- **Resultado Esperado:** Todos los registros se envían y almacenan con estado `presente` en una única transacción.
- **Resultado Obtenido:** 25 registros confirmados como presentes exitosamente.
- **Estado:** APROBADA.
