# Eventos WebSocket — Plugin Preceptoría

El plugin emite eventos para mantener informados a los directivos y actualizar paneles en vivo.

### Eventos Emitidos

| Evento | Ámbito (Room) | Payload | Descripción |
|---|---|---|---|
| `preceptoria:asistencia_tomada` | `clase_{claseId}` | `{ claseId, fecha, preceptorId, presentes, ausentes, tardanzas }` | Notifica que la asistencia de la jornada fue guardada o rectificada |
| `preceptoria:alerta_regularidad` | `directivos` | `{ alumnoId, nombre, claseId, porcentaje }` | Se dispara cuando un alumno cae por debajo del 75% de asistencia |
