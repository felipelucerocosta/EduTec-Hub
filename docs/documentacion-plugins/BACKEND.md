# Documentación Técnica del Backend de Plugins (TECH-ROOM 29)

Este documento detalla la arquitectura, el diseño de endpoints, los servicios de negocio, las capas de persistencia y la seguridad del backend para los plugins **EduTech Preceptoría** y **EduTech Oportunidades**.

---

## 1. Arquitectura del Backend

### 1.1 Patrón Arquitectónico en Capas
El backend de cada plugin implementa el patrón clásico **N-Capas (N-Tier)** con separación estricta de responsabilidades:

1. **Capa de Enrutamiento y Middleware (`routes/` & `middleware/`)**:
   - Captura las solicitudes HTTP entrantes.
   - Aplica guardas de seguridad (`requireAuth`, `requireRoles`, `requireExclusivoPreceptor`).
   - Si la sesión no es válida o el rol no tiene permisos, interrumpe el ciclo de vida con un código de error HTTP (401 o 403) antes de alcanzar la lógica de negocio.
2. **Capa de Controladores (`controllers/`)**:
   - Desempaqueta y valida los datos de entrada (`req.params`, `req.query`, `req.body`).
   - Llama a los métodos del servicio correspondiente.
   - Formatea la respuesta en JSON uniforme: `{ success: true, data: ... }` o `{ success: false, error: ... }`.
3. **Capa de Servicios y Negocio (`services/`)**:
   - Contiene las reglas operativas, validaciones de fechas, cálculos de porcentajes y lógicas de cupos.
   - Orquesta transacciones SQL complejas.
   - Emite eventos a través del bus de WebSockets (`socket_bus.ts`).
4. **Capa de Persistencia (`database/` & `pool`)**:
   - Administra conexiones al motor de base de datos relacional (SQLite con emulación PostgreSQL de `$1, $2, ...`).
   - Ejecuta consultas parametrizadas seguras para prevenir inyecciones SQL.

---

### 1.2 Registro y Montaje en Express

El archivo [backend/server.ts](file:///c:/Users/marti/EduTec-Hub/backend/server.ts) inicializa la aplicación Express y delega el arranque de los módulos en [plugins/index.ts](file:///c:/Users/marti/EduTec-Hub/plugins/index.ts):

```typescript
// backend/server.ts (fragmento)
const pluginRegistry = interop(require('../plugins/index'));

async function startServer() {
  await setupDb(); // 1. Base central de EduTec-Hub

  if (pluginRegistry && typeof pluginRegistry.mountAll === 'function') {
    await pluginRegistry.mountAll(app); // 2. Migraciones y rutas de los plugins
    console.log('✅ [Plugin Registry] Todos los plugins habilitados han sido montados.');
  }

  // 3. Manejador 404 exclusivo para la API (Garantiza NUNCA responder HTML en /api/*)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `Endpoint API no encontrado: ${req.method} ${req.originalUrl}` });
  });
}
```

---

## 2. Base de Datos y Modelo Relacional

Ambos plugins se conectan al archivo de base de datos canónico `database/edutechhub.sql` mediante el adaptador universal `conexion_pg.ts`.

### 2.1 Tablas del Plugin EduTech Preceptoría
Definidas en [plugins/edutech-preceptoria/backend/database/setup_plugin_db.ts](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-preceptoria/backend/database/setup_plugin_db.ts):

#### A. `preceptores_clases`
Vincula un preceptor con las comisiones que tiene asignadas formalmente:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `preceptor_id` (INTEGER, FK -> `usuarios(id_usuario)` ON DELETE CASCADE)
- `clase_id` (INTEGER, FK -> `clases(id)` ON DELETE CASCADE)
- `fecha_asignacion` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- Restricción: `UNIQUE(preceptor_id, clase_id)`

#### B. `plugin_preceptoria_sesiones`
Representa una jornada de asistencia para una comisión en una fecha determinada:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `clase_id` (INTEGER, FK -> `clases(id)` ON DELETE CASCADE)
- `fecha` (TEXT NOT NULL, formato ISO `YYYY-MM-DD`)
- `preceptor_id` (INTEGER, FK -> `usuarios(id_usuario)`)
- `observaciones` (TEXT, novedades de la jornada escolar)
- `fecha_registro` & `ultima_modificacion` (TIMESTAMP)
- Restricción: `UNIQUE(clase_id, fecha)`

#### C. `plugin_preceptoria_registros`
Estado individual de asistencia de cada estudiante en una sesión:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `sesion_id` (INTEGER, FK -> `plugin_preceptoria_sesiones(id)` ON DELETE CASCADE)
- `alumno_id` (INTEGER, FK -> `usuarios(id_usuario)`)
- `estado` (TEXT CHECK `estado IN ('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO')`)
- `observacion` (TEXT, motivo de inasistencia o justificación médica)
- `modificado_por` (INTEGER, FK -> `usuarios(id_usuario)`)
- Restricción: `UNIQUE(sesion_id, alumno_id)`

#### D. `plugin_preceptoria_constancias`
Solicitud y expedición de certificados oficiales de alumno regular:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `alumno_id` (INTEGER, FK -> `usuarios(id_usuario)` ON DELETE CASCADE)
- `preceptor_id` (INTEGER, preceptor que resolvió el trámite)
- `clase_id` (INTEGER, comisión de referencia)
- `motivo` (TEXT, p. ej. "Asignación Familiar", "Pase de transporte", etc.)
- `estado` (TEXT CHECK `estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')`)
- `codigo_verificacion` (TEXT UNIQUE, p. ej. `CAR-2026-A9F3K1`)
- `fecha_solicitud` & `fecha_resolucion` (TIMESTAMP)

#### E. `plugin_asistencias_docentes`
Fiscalización de presentismo del cuerpo de profesores:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `profesor_id` (INTEGER, FK -> `usuarios(id_usuario)` ON DELETE CASCADE)
- `fecha` (TEXT NOT NULL)
- `estado` (TEXT CHECK `estado IN ('PRESENTE', 'AUSENTE_JUSTIFICADO', 'AUSENTE_INJUSTIFICADO', 'TARDE')`)
- `motivo` & `observaciones` (TEXT)
- Restricción: `UNIQUE(profesor_id, fecha)`

---

### 2.2 Tablas del Plugin EduTech Oportunidades
Definidas en [plugins/edutech-oportunidades/backend/database/setup_plugin_db.ts](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-oportunidades/backend/database/setup_plugin_db.ts):

#### A. `plugin_oportunidades`
Almacena las convocatorias institucionales publicadas:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `titulo`, `institucion`, `descripcion`, `categoria` (TEXT NOT NULL)
- `tipo_oportunidad` (TEXT DEFAULT `'pasantia'`: pasantía, proyecto técnico, investigación, beca)
- `vacantes_totales` (INTEGER NOT NULL DEFAULT 1)
- `vacantes_ocupadas` (INTEGER NOT NULL DEFAULT 0)
- `fecha_cierre_inscripcion` (DATE NOT NULL)
- `modalidad` (TEXT NOT NULL: `'presencial'`, `'remoto'`, `'hibrido'`)
- `responsable_id` (INTEGER, FK -> `usuarios(id_usuario)`)
- `contacto_email` (TEXT NOT NULL)
- `estado` (TEXT DEFAULT `'abierta'`: abierta, cerrada, finalizada)

#### B. `plugin_oportunidades_postulaciones`
Registra la postulación enviada por un alumno a una vacante:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `oportunidad_id` (INTEGER, FK -> `plugin_oportunidades(id)` ON DELETE CASCADE)
- `alumno_id` (INTEGER, FK -> `usuarios(id_usuario)`)
- `presentacion`, `motivacion`, `conocimientos_previos`, `disponibilidad` (TEXT)
- `estado` (TEXT DEFAULT `'pendiente'`: pendiente, en_evaluacion, entrevista, aceptada, rechazada, lista_espera, cancelada)
- `notas_responsable` (TEXT, devolución privada del evaluador)
- Restricción: `UNIQUE(oportunidad_id, alumno_id)`

---

## 3. Catálogo Completo de Endpoints REST

### 3.1 Endpoints de EduTech Preceptoría (`/api/plugins/edutech-preceptoria`)

| Método | Ruta | Rol Autorizado | Controlador | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Público | `getHealth` | Estado y versión del plugin. |
| `GET` | `/clases` | Preceptor / Admin | `getClasesPreceptor` | Devuelve las comisiones a cargo. |
| `GET` | `/clases/:claseId/planilla` | Preceptor asignado | `getPlanillaFecha` | Carga la lista de alumnos y estados para una fecha. |
| `POST` | `/clases/:claseId/asistencia` | Exclusivo Preceptor asignado | `guardarAsistencia` | Asienta o actualiza la toma de lista transaccional. |
| `GET` | `/clases/:claseId/historial` | Preceptor / Admin | `getHistorial` | Listado histórico de jornadas tomadas. |
| `GET` | `/clases/:claseId/estadisticas` | Preceptor / Admin | `getEstadisticas` | Porcentaje global y totales de asistencia del curso. |
| `GET` | `/mi-asistencia` | Alumno | `getMiAsistencia` | Consulta de presentismo personal y condición de regularidad. |
| `POST` | `/solicitar-constancia` | Alumno | `solicitarConstancia` | Solicita constancia de alumno regular. |
| `GET` | `/constancias` | Preceptor / Admin | `listarConstancias` | Bandeja de constancias pendientes y emitidas. |
| `PUT` | `/constancias/:id` | Preceptor / Admin | `resolverConstancia` | Aprueba o rechaza una constancia (genera código de validación). |
| `POST` | `/constancias/emitir-directa` | Preceptor / Admin | `emitirConstanciaDirecta` | Emite una constancia directamente sin solicitud previa. |
| `GET` | `/mi-asistencia-docente` | Profesor | `getMiAsistenciaDocente` | Consulta de asistencia laboral personal del docente. |
| `GET` | `/docentes/asistencias` | Preceptor / Admin | `listarAsistenciasDocentes` | Nómina de presentismo del cuerpo de profesores. |
| `POST` | `/docentes/asistencias` | Preceptor / Admin | `guardarAsistenciaDocente` | Asienta o modifica asistencia de un profesor. |
| `DELETE` | `/docentes/asistencias/:id` | Admin | `eliminarAsistenciaDocente` | Elimina un registro de asistencia docente. |

#### Ejemplo de Petición y Respuesta: `POST /clases/4/asistencia`
```json
// Petición (Request Body)
{
  "fecha": "2026-11-16",
  "observaciones": "Jornada habitual en Laboratorio 1",
  "registros": [
    { "alumnoId": 90, "estado": "PRESENTE", "observacion": "" },
    { "alumnoId": 91, "estado": "TARDE", "observacion": "Ingresó 8:15 con justificativo" },
    { "alumnoId": 92, "estado": "AUSENTE", "observacion": "Sin aviso" }
  ]
}

// Respuesta (HTTP 200 OK)
{
  "success": true,
  "message": "Asistencia registrada correctamente.",
  "data": {
    "success": true,
    "sesionId": 14,
    "esNueva": true
  }
}
```

---

### 3.2 Endpoints de EduTech Oportunidades (`/api/plugins/edutech-oportunidades`)

| Método | Ruta | Rol Autorizado | Controlador | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Público | `getHealth` | Estado y versión del plugin. |
| `GET` | `/oportunidades` | Autenticado | `listarOportunidades` | Catálogo filtrado por categoría, modalidad, estado y búsqueda. |
| `GET` | `/oportunidades/:id` | Autenticado | `obtenerDetalle` | Ficha técnica completa de una oportunidad. |
| `POST` | `/oportunidades` | Profesor / Admin / Preceptor | `crearOportunidad` | Publicación de nueva pasantía o proyecto. |
| `PUT` | `/oportunidades/:id` | Responsable o Admin | `modificarOportunidad` | Edición de convocatoria existente. |
| `POST` | `/oportunidades/:id/postular` | Alumno | `postularse` | Inscripción del estudiante con carta de motivación. |
| `GET` | `/mis-postulaciones` | Alumno | `misPostulaciones` | Seguimiento de solicitudes del estudiante en sesión. |
| `DELETE` | `/postulaciones/:id` | Alumno | `cancelarPostulacion` | Cancelación voluntaria de postulación pendiente. |
| `GET` | `/oportunidades/:id/postulantes` | Responsable o Admin | `verPostulantes` | Lista de aspirantes con sus perfiles académicos. |
| `PUT` | `/postulaciones/:id/estado` | Profesor / Admin / Preceptor | `actualizarEstadoPostulacion` | Evaluación de postulante y control de vacantes. |
| `GET` | `/metricas` | Profesor / Admin / Preceptor | `getMetricas` | Telemetría cuantitativa del responsable. |

---

## 4. Gestión de Concurrencia y Sockets en Tiempo Real

El subsistema utiliza `backend/socket_bus.ts` para sincronizar eventos en tiempo real entre múltiples terminales de la institución:
- **`emitToUser(userId, evento, datos)`**: Notifica exclusivamente a la sesión del usuario especificado.
- **`emitToClass(claseId, evento, datos)`**: Difunde un evento a todos los alumnos y preceptores vinculados a la comisión.
- **`emitToAuthenticated(evento, datos)`**: Difunde novedades de convocatorias a todos los usuarios conectados.
