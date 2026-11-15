# Catálogo de Endpoints REST — Plugin Preceptoría

**Ruta Base:** `/api/plugins/edutech-preceptoria`  
**Autenticación:** Requiere sesión HTTP válida.

---

### 1. Clases Asignadas
- `GET /mis-clases`
  - **Permisos:** Rol `preceptor`.
  - **Descripción:** Devuelve la lista de clases asignadas al preceptor logueado con total de alumnos por clase.
  - **Respuesta 200:** `[ { id, nombre, division, turno, total_alumnos } ]`

---

### 2. Toma de Asistencia (Exclusivo Preceptor)
- `GET /clases/:claseId/asistencia?fecha=YYYY-MM-DD`
  - **Permisos:** `preceptor` asignado a la clase o `admin`.
  - **Descripción:** Obtiene la lista de alumnos matriculados y el estado registrado para esa fecha (si ya existe).
  - **Respuesta 200:** `{ sesion: { id, fecha, observaciones }, alumnos: [ { id, nombre, apellido, estado, observacion } ] }`

- `POST /clases/:claseId/asistencia`
  - **Permisos:** **EXCLUSIVO** `preceptor` asignado a la clase. (Rechaza `admin`, `profesor`, `alumno` con 403).
  - **Body:**
    ```json
    {
      "fecha": "2026-11-15",
      "observaciones": "Acto escolar a primera hora",
      "registros": [
        { "alumno_id": 101, "estado": "presente", "observacion": "" },
        { "alumno_id": 102, "estado": "tarde", "observacion": "Ingresó 08:15" },
        { "alumno_id": 103, "estado": "ausente", "observacion": "Fiebre" }
      ]
    }
    ```
  - **Respuesta 200:** `{ ok: true, mensaje: "Asistencia guardada correctamente", sesion_id: 42 }`

---

### 3. Historial y Estadísticas
- `GET /clases/:claseId/historial`
  - **Permisos:** `preceptor` asignado o `admin`.
  - **Descripción:** Lista las fechas en las que se tomó asistencia con totales de presentes, ausentes y tardanzas.

- `GET /clases/:claseId/estadisticas`
  - **Permisos:** `preceptor` asignado o `admin`.
  - **Descripción:** Calcula tasas de presentismo global y lista alumnos con porcentaje inferior al 75%.

---

### 4. Asignaciones Institucionales (Exclusivo Admin)
- `GET /admin/asignaciones`
  - **Permisos:** Rol `admin`.
  - **Descripción:** Lista todos los preceptores de la institución y sus clases asignadas.

- `POST /admin/asignaciones`
  - **Permisos:** Rol `admin`.
  - **Body:** `{ preceptor_id: number, clase_id: number }`
  - **Respuesta 201:** Confirmación del alta de la asignación.

- `DELETE /admin/asignaciones/:id`
  - **Permisos:** Rol `admin`.
  - **Descripción:** Revoca la asignación del preceptor a la clase.
