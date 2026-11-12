# Requerimientos — EduTech Aula Activa

## Requerimientos Funcionales (RF)

- **RF-AA-01 (Publicación de Trabajos):** El profesor debe poder publicar trabajos prácticos asignando título, descripción, pautas, fecha límite, puntaje máximo y modalidad (individual o grupal) para su comisión.
- **RF-AA-02 (Gestión de Trabajos):** El docente puede modificar o eliminar consignas publicadas, actualizando a los estudiantes en tiempo real.
- **RF-AA-03 (Consulta de Consignas):** Los estudiantes matriculados en una clase pueden consultar los trabajos prácticos asignados y sus fechas de vencimiento.
- **RF-AA-04 (Recepción de Entregas):** El alumno puede subir su trabajo práctico adjuntando un archivo o texto resolutivo, registrando fecha y hora exactas.
- **RF-AA-05 (Detección de Entrega Tardía):** Si la entrega se produce con posterioridad a la fecha límite, se cataloga automáticamente como `entrega_tardia`.
- **RF-AA-06 (Reentrega):** Si la calificación fue desaprobatoria o el docente lo solicita, el estudiante puede volver a subir una entrega corregida.
- **RF-AA-07 (Corrección y Calificación):** El profesor puede evaluar las entregas asignando una nota numérica entre 1 y 10.
- **RF-AA-08 (Retroalimentación Pedagógica Obligatoria):** Si la calificación asignada es menor a 6 puntos, el sistema exige obligatoriamente un texto de devolución pedagógica justificando los aspectos a mejorar.
- **RF-AA-09 (Foro Pedagógico de Dudas):** Profesores y alumnos disponen de un hilo de mensajería asociado a la comisión para resolver dudas en tiempo real.
- **RF-AA-10 (Telemetría de Clase):** El docente dispone de métricas automáticas con total de trabajos, total de entregas, corregidas, pendientes y promedio de la comisión.

## Requerimientos No Funcionales (RNF)

- **RNF-AA-01 (Seguridad y Aislamiento):** Las consultas y entregas solo son accesibles por usuarios matriculados en la clase correspondiente.
- **RNF-AA-02 (Concurrencia y Tiempo Real):** Las acciones emiten eventos WebSocket que se propagan inmediatamente a las salas correspondientes (`clase_<id>` y `user_<id>`).
- **RNF-AA-03 (Persistencia Idempotente):** Todas las operaciones se persisten en base de datos de manera atómica sin depender exclusivamente del socket.
- **RNF-AA-04 (Usabilidad UX):** Interfaz adaptada a la identidad visual de EduTech (Dark Theme, tonos violeta y cian, tipografía Sora).

