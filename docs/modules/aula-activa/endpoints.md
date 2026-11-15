# Catálogo de Endpoints REST — Aula Activa (Módulo Nativo)

**Ruta Base:** `/api/aula-activa`  
**Autenticación:** Obligatoria en todos los endpoints (Sesión HTTP activa).

### 1. Trabajos Prácticos
- `GET /clases/:claseId/trabajos`
  - **Roles:** Alumno (matriculado), Profesor (asignado), Admin.
  - **Respuesta:** Lista de trabajos prácticos de la clase con fecha límite, estado y estadísticas.
- `POST /clases/:claseId/trabajos`
  - **Roles:** Profesor (asignado), Admin.
  - **Body:** `{ titulo, descripcion, fecha_limite, archivos_adjuntos? }`
  - **Respuesta:** 201 Created con el objeto del trabajo creado.
- `PUT /trabajos/:id`
  - **Roles:** Profesor (creador/asignado), Admin.
  - **Body:** `{ titulo?, descripcion?, fecha_limite?, estado? }`
- `DELETE /trabajos/:id`
  - **Roles:** Profesor creador, Admin.
  - **Respuesta:** 200 OK con confirmación.

### 2. Entregas y Calificaciones
- `GET /trabajos/:trabajoId/entregas`
  - **Roles:** Profesor de la clase, Admin.
  - **Respuesta:** Lista de todas las entregas recibidas de los alumnos matriculados.
- `GET /trabajos/:trabajoId/mi-entrega`
  - **Roles:** Alumno matriculado.
  - **Respuesta:** La entrega individual del estudiante con nota y devolución si ya fue corregida.
- `POST /trabajos/:trabajoId/entregar`
  - **Roles:** Alumno matriculado.
  - **Body / Multipart:** `{ contenido, archivo_url? }`
  - **Regla:** Valida que no haya expirado la fecha límite si no se permiten entregas tardías.
- `POST /entregas/:entregaId/calificar`
  - **Roles:** Profesor asignado a la clase, Admin.
  - **Body:** `{ nota: number, feedback?: string }`
  - **Regla Estricta:** Si `nota < 6`, `feedback` es obligatorio y no puede estar vacío (mínimo 5 caracteres). Retorna `400 Bad Request` si falta.

### 3. Mensajería y Métricas
- `GET /clases/:claseId/mensajes`
  - **Roles:** Participantes de la clase.
  - **Respuesta:** Historial de mensajes de la clase.
- `POST /clases/:claseId/mensajes`
  - **Roles:** Participantes de la clase.
  - **Body:** `{ contenido: string }`
  - **Respuesta:** Mensaje creado; emite socket `aula_activa:nuevo_mensaje`.
- `GET /clases/:claseId/metricas`
  - **Roles:** Profesor asignado, Admin.
  - **Respuesta:** Resumen estadístico (porcentajes de entrega, promedio de notas, distribución cualitativa).
