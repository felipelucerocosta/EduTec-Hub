# Catálogo de Endpoints RESTful — EduTech Oportunidades

Prefijo base del plugin: `/api/plugins/oportunidades`

| Método | Ruta | Roles Permitidos | Descripción |
|---|---|---|---|
| `GET` | `/health` | Público | Diagnóstico de salud y versión del plugin |
| `GET` | `/oportunidades` | alumno, profesor, admin, preceptor | Lista convocatorias con filtros (categoría, modalidad, estado, búsqueda) |
| `GET` | `/oportunidades/:id` | alumno, profesor, admin, preceptor | Obtiene la ficha técnica y requisitos completos de una oportunidad |
| `POST` | `/oportunidades` | profesor, admin, preceptor | Publica una nueva oportunidad institucional |
| `PUT` | `/oportunidades/:id` | profesor, admin, preceptor | Modifica datos, vacantes o fechas de una convocatoria |
| `POST` | `/oportunidades/:id/postular` | alumno | Registra la postulación del estudiante, dispara correo al responsable y alerta socket |
| `GET` | `/mis-postulaciones` | alumno | Lista el historial y estado de postulaciones del alumno en sesión |
| `DELETE` | `/postulaciones/:id` | alumno | Cancela una postulación activa |
| `GET` | `/oportunidades/:id/postulantes` | profesor, admin, preceptor | Consulta los estudiantes postulados y sus datos de contacto |
| `PUT` | `/postulaciones/:id/estado` | profesor, admin, preceptor | Evalúa una postulación (entrevista, aceptar con control de vacante, rechazar) |
| `GET` | `/metricas` | profesor, admin, preceptor | Telemetría agregada de convocatorias, postulantes y vacantes cubiertas |

