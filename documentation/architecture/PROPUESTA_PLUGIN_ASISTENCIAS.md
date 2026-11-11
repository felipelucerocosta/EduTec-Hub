# DOCUMENTO DE DEFINICIÓN Y ARQUITECTURA DEL PLUGIN
## Plugin 1: Asistencia Académica y Control de Regularidad (`asistencia-academica`)
**Plataforma Base:** EduTech-Hub  
**Materia:** Prácticas Profesionalizantes — E.E.S.T. N° 29 D.E. 6  
**Autor:** Integrante 1 (Equipo de Ingeniería de Software)

---

## 1. Justificación y Necesidad Institucional
En la educación técnica oficial de la Ciudad Autónoma de Buenos Aires y de la República Argentina, el régimen de asistencia escolar y acreditación de talleres rige la regularidad de los estudiantes.
Un alumno que supera el tope de inasistencias institucionales (o cae por debajo del 75% u 85% de asistencia a clase/taller) pierde la condición de alumno regular y debe reincorporarse o rendir examen en comisión evaluadora.

**Análisis de vacancia en EduTech-Hub:**
La auditoría del sistema base demostró que la plataforma administra materias, entregas de trabajos prácticos, foros y boletines de calificaciones, pero **carece en su totalidad de un módulo de registro de presentismo y control de regularidad escolar**.
El desarrollo del plugin `asistencia-academica` resuelve esta necesidad real, aportando un alto valor pedagógico sin duplicar código ni funciones existentes.

---

## 2. Alcance Funcional por Rol

### 2.1. Rol Profesor
- Selección de cualquiera de sus comisiones y materias asignadas.
- Selección o ingreso de fecha lectiva (con fecha actual por defecto).
- Carga de planilla de asistencia ágil de todos los estudiantes inscriptos en la clase.
- Asignación de estados normados:
  - `PRESENTE`: Asistencia completa.
  - `AUSENTE`: Falta injustificada.
  - `TARDE`: Llegada con tardanza (cómputo de media falta).
  - `JUSTIFICADO`: Inasistencia con certificado médico o institucional.
- Registro de observaciones individuales (ej. "Retiro anticipado autorizado").
- Operación idempotente: guardar nuevamente para la misma fecha y clase actualiza los registros sin duplicación.
- Consulta del historial de fechas tomadas y métrica de presentismo del curso.

### 2.2. Rol Alumno
- Visualización de su tablero personal de regularidad por materia.
- Indicador visual de regularidad:
  - **Regular (≥ 75%):** Estado óptimo en verde.
  - **En Riesgo (65% - 74%):** Alerta preventiva en ámbar.
  - **Condición Crítica (< 65%):** Advertencia de pérdida de regularidad en rojo.
- Desglose detallado de asistencias, tardanzas, ausencias y faltas justificadas.
- Registro de fechas específicas con inasistencia para seguimiento de temas pedagógicos perdidos.

### 2.3. Rol Administrador
- Panel de supervisión institucional y telemetría de asistencia escolar.
- Resumen consolidado del porcentaje de presentismo por cada división (1ro 1ra a 6to 2da).
- Monitoreo del estado del servicio (`health check`), versión y tiempo de actividad del plugin.
- Bitácora de auditoría de tomas de asistencia realizadas por el cuerpo docente.

---

## 3. Arquitectura del Plugin y Principio de Desacoplamiento

El plugin se estructura en el directorio independiente `plugins/asistencia-academica/`:

```
EduTech-Hub/
├── backend/
├── frontend/
├── database/
│
├── plugins/
│   ├── index.ts                      <-- Plugin Registry del Backend
│   ├── plugin_types.ts               <-- Interfaces comunes para plugins
│   │
│   ├── asistencia-academica/         <-- PLUGIN 1 (Desarrollado en este proyecto)
│   │   ├── package.json              <-- Metadatos y manifiesto del plugin
│   │   ├── README.md                 <-- Documentación específica del plugin
│   │   │
│   │   ├── backend/
│   │   │   ├── routes/
│   │   │   │   └── asistencia_routes.ts   <-- Enrutador Express REST
│   │   │   ├── controllers/
│   │   │   │   └── asistencia_controller.ts <-- Lógica de presentación y respuestas
│   │   │   ├── services/
│   │   │   │   └── asistencia_service.ts    <-- Lógica de negocio y cálculos
│   │   │   ├── models/
│   │   │   │   └── asistencia_model.ts      <-- Capa de acceso a base de datos
│   │   │   ├── middleware/
│   │   │   │   └── asistencia_auth.ts       <-- Validaciones de rol y permisos
│   │   │   └── database/
│   │   │       ├── schema.sql               <-- DDL de tablas del plugin
│   │   │       └── setup_plugin_db.ts       <-- Inicializador idempotente
│   │   │
│   │   ├── frontend/
│   │   │   ├── components/
│   │   │   │   ├── AsistenciaDocenteView.tsx  <-- Planilla interactiva de asistencia
│   │   │   │   ├── AsistenciaAlumnoView.tsx   <-- Panel de regularidad del estudiante
│   │   │   │   └── AsistenciaAdminView.tsx    <-- Telemetría institucional
│   │   │   ├── pages/
│   │   │   │   └── AsistenciaPage.tsx         <-- Página contenedora integrada
│   │   │   ├── services/
│   │   │   │   └── asistencia_api.ts          <-- Cliente HTTP desacoplado
│   │   │   └── styles/
│   │   │       └── asistencia.module.css      <-- Estilos alineados a Design System
│   │   │
│   │   └── tests/
│   │       └── asistencia_blackbox.test.ts    <-- Suite de 10 pruebas de caja negra
│   │
│   └── plugin-companero/             <-- ESPACIO RESERVADO PARA PLUGIN 2 (Intacto)
│
└── documentation/
    ├── architecture/
    ├── uml/
    ├── deployment/
    └── testing/
```

---

## 4. Diseño del Esquema de Persistencia (SQLite / PostgreSQL)

Las tablas del plugin utilizan el prefijo `plugin_asistencias_` para garantizar aislamiento absoluto respecto de las tablas base:

```sql
-- 1. Cabecera de la jornada de asistencia
CREATE TABLE IF NOT EXISTS plugin_asistencias_sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clase_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,                  -- Formato ISO: YYYY-MM-DD
    creado_por INTEGER NOT NULL,
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
    FOREIGN KEY(creado_por) REFERENCES usuarios(id_usuario),
    UNIQUE(clase_id, fecha)              -- Garantiza una única sesión por clase y fecha
);

-- 2. Registro individual por estudiante
CREATE TABLE IF NOT EXISTS plugin_asistencias_registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sesion_id INTEGER NOT NULL,
    alumno_id INTEGER NOT NULL,
    estado TEXT NOT NULL CHECK(estado IN ('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO')),
    observacion TEXT,
    FOREIGN KEY(sesion_id) REFERENCES plugin_asistencias_sesiones(id) ON DELETE CASCADE,
    FOREIGN KEY(alumno_id) REFERENCES usuarios(id_usuario),
    UNIQUE(sesion_id, alumno_id)         -- Un registro por alumno en cada sesión
);
```

---

## 5. Especificación de Endpoints RESTful

Todos los endpoints se alojan bajo el prefijo `/api/plugins/asistencia-academica`:

| Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | Público / Cualquiera | Diagnóstico de salud y versión del plugin |
| `GET` | `/clases` | `profesor`, `admin` | Lista de clases asignadas al docente |
| `GET` | `/clases/:claseId/fechas` | `profesor`, `admin` | Fechas en que ya se tomó asistencia |
| `GET` | `/clases/:claseId` | `profesor`, `admin` | Planilla de asistencia para una fecha (`?fecha=YYYY-MM-DD`) |
| `POST`| `/clases/:claseId` | `profesor`, `admin` | Guarda o actualiza la planilla de asistencia (idempotente) |
| `GET` | `/alumno/resumen` | `alumno`, `admin` | Resumen de regularidad y métricas del alumno logueado |
| `GET` | `/alumno/clase/:claseId` | `alumno`, `admin` | Detalle fecha a fecha de inasistencias en una materia |
| `GET` | `/admin/estadisticas` | `admin` | Reporte general consolidado de presentismo por división |

---

## 6. Integración Limpia con el Sistema Base
1. **Backend:** En `backend/server.ts`, se importa y monta el `pluginManager`. Si el plugin se desactiva, el servidor base inicia con normalidad sin lanzar excepciones.
2. **Frontend:** En `frontend/src/components/layout/Sidebar.tsx`, se agrega un acceso de navegación `"Asistencias"` protegido por rol. En `frontend/src/App.tsx`, se monta la ruta `/asistencia`.
3. **Autenticación Compartida:** El plugin lee `req.session.usuario` directamente del sistema base sin exigir credenciales ni tokens duplicados.

