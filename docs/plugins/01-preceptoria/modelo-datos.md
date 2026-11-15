# Modelo de Datos — Plugin Preceptoría

### 1. Tabla `preceptores_clases` (Relación Institucional)
Vincula a los usuarios de rol `preceptor` con las clases que tienen bajo su supervisión.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador del vínculo |
| `preceptor_id` | INTEGER | NOT NULL, FK(usuarios.id) | ID del usuario con rol `preceptor` |
| `clase_id` | INTEGER | NOT NULL, FK(clases.id) | ID de la clase asignada |
| `fecha_asignacion` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha en que el admin otorgó la asignación |
| *Restricción Única* | UNIQUE(preceptor_id, clase_id) | | Previene asignaciones duplicadas |

---

### 2. Tabla `plugin_preceptoria_sesiones` (Cabecera de Toma Diaria)
Representa una jornada/sesión de asistencia para una clase específica.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador de la sesión |
| `clase_id` | INTEGER | NOT NULL, FK(clases.id) | Clase en la que se tomó asistencia |
| `fecha` | DATE | NOT NULL | Fecha de la asistencia (formato YYYY-MM-DD) |
| `preceptor_id` | INTEGER | NOT NULL, FK(usuarios.id) | Preceptor responsable de la toma |
| `observaciones` | TEXT | NULL | Notas adicionales de la jornada |
| `creado_en` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Momento del registro inicial |
| `actualizado_en` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Momento de la última rectificación |
| *Restricción Única* | UNIQUE(clase_id, fecha) | | Solo puede haber una sesión por clase y fecha |

---

### 3. Tabla `plugin_preceptoria_registros` (Detalle por Alumno)
Detalla el estado individual de cada alumno dentro de la sesión.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador del registro |
| `sesion_id` | INTEGER | NOT NULL, FK(plugin_preceptoria_sesiones.id) | Sesión a la que pertenece |
| `alumno_id` | INTEGER | NOT NULL, FK(usuarios.id) | Alumno registrado |
| `estado` | VARCHAR(20) | CHECK(estado IN ('presente','ausente','tarde','justificado')) | Estado de asistencia |
| `observacion` | VARCHAR(255) | NULL | Justificación de inasistencia o motivo de tardanza |
| `registrado_en` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp de auditoría |
| *Restricción Única* | UNIQUE(sesion_id, alumno_id) | | Un único estado por alumno por sesión |
