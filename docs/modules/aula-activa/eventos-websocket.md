# Eventos WebSocket — Aula Activa (Módulo Nativo)

El módulo se integra al bus de eventos Socket.IO del núcleo (`backend/socket_bus.ts`).

### Eventos Emitidos por el Servidor

| Evento | Ámbito (Room) | Payload | Descripción |
|---|---|---|---|
| `aula_activa:nuevo_trabajo` | `clase_{claseId}` | `{ trabajoId, titulo, claseId, fecha_limite }` | Notifica a todos los estudiantes de la clase que hay una nueva actividad |
| `aula_activa:entrega_recibida` | `clase_{claseId}` | `{ trabajoId, entregaId, alumnoId, nombre_alumno }` | Informa al docente que un alumno ha entregado su resolución |
| `aula_activa:entrega_corregida`| `usuario_{alumnoId}` | `{ trabajoId, entregaId, nota, feedback, aprobado }`| Notificación directa al estudiante con su nota y devolución |
| `aula_activa:nuevo_mensaje` | `clase_{claseId}` | `{ mensajeId, remitenteId, nombre, contenido, fecha }` | Mensaje instantáneo para el muro de diálogo de la clase |

### Protocolo de Conexión en Frontend
1. Al ingresar a la vista de Aula Activa, el cliente se une a la sala:
   ```typescript
   socket.emit('unirse_clase', { claseId });
   ```
2. Al recibir un evento:
   ```typescript
   socket.on('aula_activa:nuevo_trabajo', (data) => {
     // Actualiza la lista de trabajos sin recargar la página
   });
   ```
