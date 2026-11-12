# Requerimientos — EduTech Oportunidades

## Requerimientos Funcionales (RF)

- **RF-OP-01 (Publicación de Oportunidades):** Las instituciones y docentes autorizados pueden publicar convocatorias con título, descripción, categoría, requisitos, vacantes y fecha de cierre.
- **RF-OP-02 (Exploración y Filtrado):** Los estudiantes pueden explorar todas las oportunidades abiertas y filtrar por categoría tecnológica, modalidad y búsqueda por palabras clave.
- **RF-OP-03 (Inscripción de Alumnos):** El alumno autenticado puede postularse enviando una carta de motivación y disponibilidad sin necesidad de volver a ingresar datos básicos.
- **RF-OP-04 (Prevención de Postulaciones Duplicadas):** El sistema impide que un estudiante se inscriba más de una vez a la misma convocatoria.
- **RF-OP-05 (Cierre Automático por Vencimiento):** El backend actualiza automáticamente a estado `cerrada` las convocatorias cuya fecha de cierre de inscripción sea anterior a la fecha actual.
- **RF-OP-06 (Control de Vacantes):** El sistema impide que una convocatoria supere su cupo de vacantes totales al aceptar postulaciones.
- **RF-OP-07 (Notificación Automática por Correo al Responsable):** Al registrarse una postulación, el responsable institucional recibe un correo formal con el nombre, correo electrónico y motivación del estudiante.
- **RF-OP-08 (Gestión y Evaluación de Postulantes):** El responsable puede actualizar el estado de cada postulación (`en_evaluacion`, `entrevista`, `aceptada`, `rechazada`, `lista_espera`) con notas de devolución.
- **RF-OP-09 (Cancelación de Postulación por el Alumno):** El alumno puede cancelar una postulación que esté pendiente, liberando la vacante si estuviese asignada.
- **RF-OP-10 (Telemetría y Dashboard Institucional):** El panel de responsables y administradores consolida totales de convocatorias, postulaciones recibidas, pendientes de evaluar y estudiantes aceptados.

## Requerimientos No Funcionales (RNF)

- **RNF-OP-01 (Privacidad de Datos):** La dirección de correo electrónico y datos personales del estudiante solo son visibles para responsables autorizados de la convocatoria.
- **RNF-OP-02 (Tolerancia a Fallos en Envío de Emails):** Si el servidor SMTP no está configurado o falla temporalmente, la postulación se guarda con éxito y se registra un log de contingencia sin interrumpir al usuario.
- **RNF-OP-03 (Actualización en Vivo):** Cambios de estado y nuevas postulaciones se propagan en tiempo real vía WebSockets a los usuarios involucrados.
- **RNF-OP-04 (Diseño Responsivo):** Interfaz fluida adaptable a computadoras de escritorio, tablets y dispositivos móviles.

