# Guía de Despliegue y Activación — Plugin Preceptoría

## 1. Requisitos Previos
- Servidor Node.js v18+ con TypeScript.
- Base de datos SQLite / PostgreSQL inicializada con EduTech.
- Tabla `usuarios` con soporte para el rol `'preceptor'` en la columna `rol`.

## 2. Inicialización Automática
El plugin se registra en `plugins/index.ts` y monta automáticamente sus esquemas de base de datos a través de `setup_plugin_db.ts`:
1. Crea la tabla `preceptores_clases` si no existe.
2. Crea la tabla `plugin_preceptoria_sesiones` si no existe.
3. Crea la tabla `plugin_preceptoria_registros` si no existe.
4. Genera los índices de búsqueda optimizados para `(clase_id, fecha)` y `(sesion_id, alumno_id)`.

## 3. Desactivación o Desinstalación Segura
- Para deshabilitar temporalmente el plugin, cambiar `"enabled": false` en `plugins/edutech-preceptoria/manifest.json`.
- Al reiniciar el servidor, `PluginRegistry` omitirá el montaje de las rutas `/api/plugins/edutech-preceptoria`.
- Los datos de asistencia permanecerán preservados en la base de datos sin interferir con el funcionamiento regular de EduTech.
