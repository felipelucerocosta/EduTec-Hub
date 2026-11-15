# Modelo de Datos — Aula Activa (Módulo Nativo)

El módulo opera directamente sobre las tablas principales de la base de datos de EduTech:

### 1. Tabla `trabajos`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único del trabajo práctico |
| `titulo` | VARCHAR(255) | NOT NULL | Título de la actividad |
| `descripcion` | TEXT | NULL | Consigna detallada, enlaces e instrucciones |
| `clase_id` | INTEGER | NOT NULL, FK(clases.id) | Clase a la que pertenece la asignación |
| `profesor_id` | INTEGER | NOT NULL, FK(usuarios.id) | Docente creador |
| `fecha_creacion` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha de publicación |
| `fecha_limite` | DATETIME | NULL | Fecha máxima permitida para la entrega |
| `archivos_adjuntos` | TEXT | NULL | JSON serializado con nombres o URLs de archivos |
| `estado` | VARCHAR(50) | DEFAULT 'publicado' | 'borrador', 'publicado', 'archivado' |

### 2. Tabla `entregas`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único de la entrega |
| `trabajo_id` | INTEGER | NOT NULL, FK(trabajos.id) | Trabajo práctico asociado |
| `alumno_id` | INTEGER | NOT NULL, FK(usuarios.id) | Alumno autor de la entrega |
| `clase_id` | INTEGER | NOT NULL, FK(clases.id) | Clase en la que se entregó |
| `fecha_entrega` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp de la recepción |
| `contenido` | TEXT | NULL | Texto, comentarios o enlaces de la resolución |
| `archivo_url` | TEXT | NULL | Ruta al archivo subido por el estudiante |
| `estado` | VARCHAR(50) | DEFAULT 'entregado' | 'entregado', 'corregido', 'reenviado' |
| `nota` | NUMERIC(4,2) | NULL (1.00 - 10.00) | Calificación numérica |
| `feedback` | TEXT | NULL | Devolución pedagógica (Obligatorio si nota < 6) |
| `fecha_correccion` | DATETIME | NULL | Momento en el que se corrigió |

### 3. Tabla `aula_activa_mensajes` (Mensajería por Clase)
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador del mensaje |
| `clase_id` | INTEGER | NOT NULL, FK(clases.id) | Clase vinculada |
| `remitente_id` | INTEGER | NOT NULL, FK(usuarios.id) | Autor del mensaje |
| `contenido` | TEXT | NOT NULL | Texto del mensaje |
| `fecha` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Momento de publicación |
