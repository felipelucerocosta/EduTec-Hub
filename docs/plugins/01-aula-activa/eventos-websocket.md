# Eventos WebSocket — EduTech Aula Activa

Aula Activa utiliza el bus de sockets centralizado (`backend/socket_bus.ts`) con salas por clase (`clase_<id>`) y usuario (`user_<id>`).

| Nombre del Evento | Canal / Destino | Carga Útil (Payload) | Disparador |
|---|---|---|---|
| `assignment.published` | `clase_<id>` | `{ id, clase_id, titulo, fecha_limite }` | Publicación de nueva consigna por el profesor |
| `assignment.updated` | `clase_<id>` | `{ id, clase_id, titulo, fecha_limite, deleted? }` | Modificación o eliminación de una consigna |
| `assignment.submitted` | `clase_<id>` | `{ trabajo_id, alumno_id, estado }` | Alumno sube o actualiza su entrega |
| `assignment.corrected` | `user_<alumno_id>` | `{ entrega_id, calificacion, estado, feedback }` | Docente califica una entrega |
| `grade.updated` | `user_<alumno_id>`, `clase_<id>` | `{ alumno_id, calificacion }` | Actualización de calificación oficial |
| `performance.updated` | `user_<alumno_id>`, `clase_<id>` | `{ alumno_id, clase_id }` | Recálculo de métricas pedagógicas |
| `message.created` | `clase_<id>` | `{ id, clase_id, usuario_id, mensaje }` | Nueva consulta o respuesta en el foro |
| `notification.created` | `user_<id>` | `{ id, tipo, titulo, mensaje }` | Notificación persistida en el centro de alertas |

