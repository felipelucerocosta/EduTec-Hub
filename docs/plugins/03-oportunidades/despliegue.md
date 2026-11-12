# Manual de Despliegue — EduTech Oportunidades

## Requisitos
- Node.js versión 18+.
- Base de datos SQLite / PostgreSQL oficial.
- (Opcional) Configuración SMTP para envío de correos salientes a los responsables.

## Variables de Entorno (`backend/.env`)
Para activar las notificaciones por correo electrónico al responsable:
```env
SMTP_HOST=smtp.tu-servidor.edu.ar
SMTP_PORT=587
SMTP_USER=notificaciones@tu-servidor.edu.ar
SMTP_PASS=tu_clave_de_aplicacion
SMTP_FROM="EduTech Oportunidades" <no-reply@tu-servidor.edu.ar>
```
*Nota:* Si estas variables no se configuran, el plugin continuará funcionando normalmente mediante notificaciones en plataforma y logs controlados.

## Pasos de Instalación
1. Confirmar el directorio `plugins/oportunidades/`.
2. Registrar el plugin en `plugins/index.ts`:
   ```typescript
   import oportunidadesPlugin from './oportunidades/backend/index';
   pluginRegistry.register(oportunidadesPlugin);
   ```
3. Compilar backend y frontend:
   ```bash
   npm run build:backend
   npm run build
   ```
4. El esquema `plugin_oportunidades` y `plugin_oportunidades_postulaciones` se inicializa de manera idempotente al arrancar el servidor.

