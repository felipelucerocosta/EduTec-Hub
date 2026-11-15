# Arquitectura Técnica — Plugin Preceptoría

```
+---------------------------------------------------------------------------------------+
|                                    PLUGIN REGISTRY                                    |
+---------------------------------------------------------------------------------------+
|  Mount Path: /api/plugins/edutech-preceptoria                                         |
|  Manifest: plugins/edutech-preceptoria/manifest.json                                  |
|  Plugin Entry: plugins/edutech-preceptoria/backend/index.ts                           |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  [ FRONTEND ]                                                                         |
|  - Page: plugins/edutech-preceptoria/frontend/pages/PreceptoriaPage.tsx               |
|  - Views:                                                                             |
|      * PreceptoriaTomaAsistenciaView.tsx                                              |
|      * PreceptoriaHistorialView.tsx                                                   |
|      * PreceptoriaEstadisticasView.tsx                                                |
|      * PreceptoriaAdminAsignacionesView.tsx                                           |
|  - API Client: plugins/edutech-preceptoria/frontend/services/preceptoria_api.ts         |
|  - Styles: plugins/edutech-preceptoria/frontend/styles/preceptoria.module.css          |
|                                                                                       |
|                                  | HTTP REST & WebSocket (Socket.IO)                  |
|                                  v                                                    |
|                                                                                       |
|  [ BACKEND ]                                                                          |
|  - Router: plugins/edutech-preceptoria/backend/routes/preceptoria_routes.ts           |
|  - Middleware: plugins/edutech-preceptoria/backend/middleware/preceptoria_auth.ts     |
|      * requireExclusivoPreceptor (Rechaza todo rol != 'preceptor')                    |
|      * requirePreceptorAsignadoAClase (Valida relación en preceptores_clases)         |
|      * requireAdmin (Para asignación institucional de clases)                         |
|  - Controller: plugins/edutech-preceptoria/backend/controllers/preceptoria_controller.ts|
|  - Service: plugins/edutech-preceptoria/backend/services/preceptoria_service.ts       |
|  - Migration: plugins/edutech-preceptoria/backend/database/setup_plugin_db.ts          |
|                                                                                       |
|                                  | SQL Execution                                      |
|                                  v                                                    |
|                                                                                       |
|  [ DATABASE LAYER ]                                                                   |
|  - Core Table: preceptores_clases                                                     |
|  - Plugin Tables:                                                                     |
|      * plugin_preceptoria_sesiones                                                    |
|      * plugin_preceptoria_registros                                                   |
|                                                                                       |
+---------------------------------------------------------------------------------------+
```
