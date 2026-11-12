# Eventos WebSocket — EduTech Oportunidades

Eventos emitidos en tiempo real por el plugin mediante el bus de sockets centralizado (`socket_bus.ts`):

| Evento | Destino | Payload | Descripción |
|---|---|---|---|
| `opportunity.created` | Global (`@all`) | `{ id, titulo, institucion, categoria, vacantes }` | Nueva convocatoria publicada en el portal |
| `opportunity.updated` | Global (`@all`) | `{ id, ...data }` | Modificación en las condiciones o fechas |
| `opportunity.closed` | Global (`@all`) | `{ id, motivo }` | Cierre por expiración o cupo cubierto |
| `opportunity.vacancies_updated` | Global (`@all`) | `{ oportunidad_id }` | Actualización de vacantes disponibles tras aceptación |
| `application.created` | `user_<responsable_id>`, `user_<alumno_id>` | `{ postulacion_id, oportunidad_id, alumno_nombre, titulo }` | Nuevo estudiante inscripto |
| `application.status_updated` | `user_<alumno_id>` | `{ postulacion_id, oportunidad_id, estado }` | Cambio de estado de la postulación |
| `application.accepted` | `user_<alumno_id>` | `{ postulacion_id }` | Estudiante seleccionado oficialmente |
| `application.rejected` | `user_<alumno_id>` | `{ postulacion_id }` | Postulación no seleccionada |

