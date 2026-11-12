# Plugin EduTech Oportunidades

## Descripción
**EduTech Oportunidades** es un portal institucional diseñado para conectar instituciones educativas y empresas con estudiantes interesados en participar en pasantías formativas, proyectos de desarrollo de software, robótica, redes, inteligencia artificial, investigaciones científicas, competencias y becas profesionales.

## Características Principales
- **Convocatorias Institucionales**: Creación de convocatorias con categoría configurable, vacantes totales, fechas de cierre, duración y modalidad (presencial, virtual o híbrida).
- **Postulaciones de Alumnos**: Formulario integrado que aprovecha la identidad oficial del usuario (nombre, correo institucional, DNI) y permite añadir trayectoria, motivación y disponibilidad.
- **Control Concurrente de Vacantes**: La vacante se ocupa de forma atómica únicamente cuando la postulación es aceptada por el responsable.
- **Notificaciones por Email y Alertas**: Envío automático de correo con los datos de contacto del estudiante al responsable institucional y alertas internas en tiempo real.
- **Ciclo de Estados de Postulación**: `pendiente`, `en_evaluacion`, `entrevista`, `aceptada`, `rechazada`, `cancelada`, `lista_espera`.

## Documentación Técnica Detallada
- [Requerimientos Funcionales y No Funcionales](./requerimientos.md)
- [Arquitectura de Software](./arquitectura.md)
- [Modelo de Datos y Esquema SQL](./modelo-datos.md)
- [Roles y Matriz de Permisos](./roles-permisos.md)
- [Catálogo de Endpoints RESTful](./endpoints.md)
- [Sistema de Notificaciones y Correo Electrónico](./notificaciones.md)
- [Eventos WebSocket](./eventos-websocket.md)
- [Manual de Despliegue](./despliegue.md)
- [Manual de Usuario para Estudiantes](./manual-usuario.md)
- [Manual de Administración Institucional](./manual-administrador.md)
- [Diagramas UML (Casos de Uso y Secuencia)](./diagramas/)

