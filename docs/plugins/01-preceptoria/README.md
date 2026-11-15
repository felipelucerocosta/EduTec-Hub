# Plugin EduTech: Preceptoría (Exclusivo Toma de Asistencia)

## 1. Identificación del Plugin
- **Identificador Único:** `edutech-preceptoria`
- **Nombre:** EduTech — Preceptoría
- **Versión:** 1.0.0
- **Ruta Base API:** `/api/plugins/edutech-preceptoria`
- **Ubicación en Código:** `plugins/edutech-preceptoria/`
- **Responsabilidad Exclusiva:** Registro, modificación y consulta de asistencia académica diaria por parte del rol **Preceptor**.

## 2. Principio Arquitectónico Fundamental
**EXCLUSIVIDAD DEL ROL PRECEPTOR PARA TOMA DE ASISTENCIA:**
- La operación de registrar y actualizar asistencias está **terminantemente reservada al rol `preceptor`**.
- El **Administrador Institucional** administra el sistema: crea usuarios con rol preceptor y gestiona las asignaciones de clases en la tabla `preceptores_clases`. Sin embargo, el administrador **NO puede registrar asistencias**, preservando la cadena de custodia y responsabilidad legal del acto administrativo escolar.
- Los **Profesores y Alumnos** no pueden modificar asistencias; pueden consultar porcentajes de regularidad de manera solo lectura en sus respectivos módulos.
- El preceptor únicamente puede tomar asistencia en aquellas clases que le fueron expresamente asignadas.

## 3. Características Principales
1. **Toma de Asistencia Rápida y por Lote:** Botón "Marcar Todos Presentes" y controles individuales rápidos para `presente`, `ausente`, `tarde` y `justificado`.
2. **Historial de Sesiones:** Consulta de fechas anteriores por clase con opción de rectificación justificada.
3. **Métricas de Presentismo:** Porcentajes de asistencia en tiempo real, desglose de inasistencias y alertas para alumnos con presentismo inferior al 75% (riesgo de pérdida de regularidad).
4. **Módulo de Asignaciones (Administrador):** Interfaz para vincular o revocar preceptores a cursos y divisiones institucionales.
