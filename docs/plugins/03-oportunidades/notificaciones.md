# Sistema de Notificaciones y Correo Electrónico — EduTech Oportunidades

## 1. Notificación al Responsable por Correo Electrónico

Cada vez que un estudiante envía una postulación a una oportunidad, el backend ejecuta el servicio `EmailOportunidadesService`.

### Variables de Entorno Requeridas (`.env`):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@institucion.edu.ar
SMTP_PASS=tu_app_password_segura
SMTP_FROM="EduTech Oportunidades" <no-reply@institucion.edu.ar>
```

### Contenido del Correo:
- **Asunto:** `[EduTech Oportunidades] Nueva postulación: <Nombre Alumno> para <Convocatoria>`
- **Cuerpo Formal:**
  - Nombre completo del estudiante.
  - Correo electrónico registrado para contacto directo.
  - DNI (si estuviese registrado).
  - Título de la convocatoria y nombre de la institución.
  - Fecha y hora exacta de la postulación.
  - Texto de motivación y conocimientos previos expresados.

### Resiliencia y Fallback:
Si las credenciales SMTP no están definidas o el servidor de correo se encuentra inaccesible, el backend emite un log informativo con los datos de la notificación sin abortar la transacción de base de datos ni provocar un fallo al usuario.

---

## 2. Notificaciones Internas en Plataforma

El sistema además inserta un registro en la tabla `notificaciones` de EduTech:
- **Para el Responsable:** Al recibir la postulación (`tipo: 'oportunidad_postulacion'`).
- **Para el Alumno:** Al actualizarse el estado de su postulación a `en_evaluacion`, `entrevista`, `aceptada` o `rechazada` (`tipo: 'oportunidad_estado'`).

