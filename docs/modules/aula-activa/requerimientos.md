# Requerimientos de Aula Activa (Módulo Nativo)

## 1. Requerimientos Funcionales (RF)

### Gestión de Trabajos Prácticos (Docentes)
- **RF-AA-01:** El docente puede crear un trabajo práctico indicando título, descripción/consigna, clase destinataria, fecha de publicación, fecha límite y archivos adjuntos o enlaces.
- **RF-AA-02:** El docente solo puede publicar trabajos en clases que tiene asignadas formalmente.
- **RF-AA-03:** El docente puede editar o archivar/eliminar trabajos prácticos existentes.
- **RF-AA-04:** El sistema debe registrar la fecha de última modificación y alertar a los estudiantes cuando las consignas cambien.

### Entregas de Trabajos (Estudiantes)
- **RF-AA-05:** El alumno puede listar las actividades de sus clases con estado visible (Pendiente, Entregado, Corregido, Fuera de término).
- **RF-AA-06:** El alumno puede enviar su resolución adjuntando archivos o enlaces y comentarios explicativos.
- **RF-AA-07:** El sistema valida la fecha límite de entrega; si se supera la fecha y no se permiten entregas tardías, se bloquea el envío.
- **RF-AA-08:** El alumno puede reenviar su entrega si el docente solicita correcciones o la configuración lo permite.

### Corrección y Calificación
- **RF-AA-09:** El docente puede calificar las entregas en escala numérica del 1 al 10.
- **RF-AA-10 (Regla Estricta):** Si la calificación otorgada es menor a 6, es obligatorio ingresar un comentario pedagógico de devolución explicando las observaciones y áreas de mejora.
- **RF-AA-11:** El sistema marca automáticamente el estado de aprobación (Aprobado si nota >= 6, Desaprobado si nota < 6).

### Mensajería Académica y Comunicación
- **RF-AA-12:** Espacio de diálogo académico contextual para cada clase, permitiendo a docentes y alumnos enviar mensajes, preguntas frecuentes y aclaraciones de consignas.
- **RF-AA-13:** Los mensajes se sincronizan en tiempo real mediante WebSockets a todos los participantes conectados a la clase.

### Métricas de Rendimiento
- **RF-AA-14:** Visualización en tiempo real para el docente con:
  - Tasa de cumplimiento de entregas (% alumnos que entregaron).
  - Promedio de calificaciones por trabajo y por clase.
  - Distribución de notas (Sobresaliente 9-10, Notable 7-8, Aprobado 6, Desaprobado 1-5).
  - Alumnos que adeudan entrega para intervención pedagógica temprana.

## 2. Requerimientos No Funcionales (RNF)
- **RNF-01 (Seguridad & Aislamiento):** Ni alumnos ni docentes pueden consultar o alterar trabajos de clases a las que no pertenecen.
- **RNF-02 (Rendimiento):** Tiempo de respuesta menor a 300ms en consultas de listado y entrega.
- **RNF-03 (Tiempo Real):** Retardo inferior a 100ms en la propagación de eventos vía Socket.IO en red local.
- **RNF-04 (Usabilidad):** Diseño coherente con el sistema de diseño oscuro de EduTech (fuente Sora, acentos cian/violeta).
