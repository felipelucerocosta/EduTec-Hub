# Plugin EduTech Aula Activa

## Descripción
**EduTech Aula Activa** es un plugin modular que provee un entorno pedagógico integral para la gestión de trabajos prácticos, recepción de entregas estudiantiles, correcciones con retroalimentación formativa obligatoria en notas bajas, cálculo de rendimiento académico en tiempo real y foros de consulta interactivos por comisión.

## Características Principales
- **Publicación de Trabajos**: Asignación de títulos, pautas, consignas, fechas límite y puntajes máximos.
- **Entregas Estudiantiles**: Recepción de resoluciones, comentarios y archivos adjuntos con registro temporal.
- **Correcciones Pedagógicas**: Calificación de 1 a 10 con retroalimentación obligatoria si la nota es menor a 6.
- **Foro Pedagógico en Tiempo Real**: Espacio de intercambio de dudas y orientaciones entre alumnos y docentes.
- **Integración con Rendimiento y WebSockets**: Emisión en vivo de eventos (`assignment.published`, `assignment.submitted`, `assignment.corrected`, `grade.updated`, `message.created`).

## Documentación Técnica Detallada
- [Requerimientos Funcionales y No Funcionales](./requerimientos.md)
- [Arquitectura de Software](./arquitectura.md)
- [Modelo de Datos](./modelo-datos.md)
- [Roles y Matriz de Permisos](./roles-permisos.md)
- [Catálogo de Endpoints RESTful](./endpoints.md)
- [Eventos WebSocket](./eventos-websocket.md)
- [Manual de Despliegue](./despliegue.md)
- [Manual de Usuario](./manual-usuario.md)
- [Diagramas UML (Casos de Uso y Secuencia)](./diagramas/)

