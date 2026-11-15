# Requerimientos — Plugin Preceptoría

## 1. Requerimientos Funcionales (RF)

### Gestión de Preceptores y Asignaciones
- **RF-PRE-01:** El Administrador puede asignar uno o varios preceptores a determinadas clases.
- **RF-PRE-02:** El Administrador puede revocar o reasignar preceptores de clases existentes.
- **RF-PRE-03:** Un preceptor únicamente puede visualizar y gestionar las clases que tiene explícitamente asignadas.

### Registro de Asistencia (Exclusivo Preceptores)
- **RF-PRE-04:** El preceptor selecciona una de sus clases asignadas y una fecha para iniciar una sesión de toma de asistencia.
- **RF-PRE-05:** La interfaz muestra la lista completa de alumnos matriculados en la clase.
- **RF-PRE-06:** El sistema permite marcar asistencias individuales en cuatro estados: `presente`, `ausente`, `tarde`, `justificado`.
- **RF-PRE-07:** La interfaz incluye una acción por lote para marcar a todos los alumnos como "Presente" con un solo clic.
- **RF-PRE-08:** El preceptor puede guardar o actualizar la sesión de asistencia para la fecha seleccionada.
- **RF-PRE-09 (Restricción de Seguridad):** Si un usuario con rol distinto a `preceptor` (incluso `admin` o `profesor`) intenta enviar un registro de asistencia, el endpoint debe rechazarlo con código HTTP `403 Forbidden`.

### Estadísticas y Alertas
- **RF-PRE-10:** Cálculo automático del porcentaje de asistencia global de la clase y por alumno individual.
- **RF-PRE-11:** Detección de alumnos en condición crítica (<75% de asistencia) para intervención del equipo de orientación o preceptoría.
- **RF-PRE-12:** Notificaciones en tiempo real vía WebSockets al guardar una sesión de asistencia.

## 2. Requerimientos No Funcionales (RNF)
- **RNF-PRE-01 (Modularidad):** El plugin debe poder deshabilitarse sin romper el núcleo ni otros plugins.
- **RNF-PRE-02 (Aislamiento de Tablas):** Las tablas del plugin llevan el prefijo `plugin_preceptoria_` excepto la tabla institucional `preceptores_clases`.
- **RNF-PRE-03 (Trazabilidad):** Cada registro de asistencia guarda el ID del preceptor que efectuó la toma y la fecha/hora exacta.
