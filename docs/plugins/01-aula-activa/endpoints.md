# Catálogo de Endpoints RESTful — EduTech Aula Activa

Prefijo base del plugin: `/api/plugins/aula-activa`

| Método | Ruta | Roles Permitidos | Descripción |
|---|---|---|---|
| `GET` | `/health` | Público | Diagnóstico de salud y versión del plugin |
| `GET` | `/clases/:claseId/trabajos` | profesor, alumno, admin, preceptor | Lista los trabajos de la clase con estado de entrega para el alumno |
| `POST` | `/clases/:claseId/trabajos` | profesor, admin | Publica un nuevo trabajo práctico |
| `PUT` | `/trabajos/:trabajoId` | profesor, admin | Actualiza consigna, fechas o puntaje de un trabajo |
| `DELETE` | `/trabajos/:trabajoId` | profesor, admin | Elimina o archiva un trabajo práctico |
| `GET` | `/trabajos/:trabajoId/entregas` | profesor, admin, preceptor | Obtiene todas las entregas recibidas para un trabajo |
| `POST` | `/trabajos/:trabajoId/entregar` | alumno | Registra o actualiza la entrega de una tarea |
| `POST` | `/entregas/:entregaId/calificar` | profesor, admin | Corrige y califica una entrega (feedback obligatorio si nota < 6) |
| `GET` | `/clases/:claseId/consultas` | profesor, alumno, admin, preceptor | Lista las consultas del foro pedagógico de la clase |
| `POST` | `/clases/:claseId/consultas` | profesor, alumno, admin, preceptor | Publica una consulta u orientación pedagógica |
| `GET` | `/clases/:claseId/metricas` | profesor, admin, preceptor | Telemetría agregada de trabajos, entregas y promedios |

