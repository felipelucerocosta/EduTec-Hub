# Manual de Despliegue — EduTech Aula Activa

## Requisitos Previos
- Node.js versión 18+ o 20+.
- Base de datos SQLite / PostgreSQL oficial de EduTech.
- Servidor backend corriendo Express y TypeScript.

## Pasos de Instalación
1. Asegurarse de que el directorio `plugins/aula-activa/` exista en el proyecto.
2. Verificar el registro en `plugins/index.ts`:
   ```typescript
   import aulaActivaPlugin from './aula-activa/backend/index';
   pluginRegistry.register(aulaActivaPlugin);
   ```
3. Compilar el backend:
   ```bash
   npm run build:backend
   ```
4. Compilar el frontend:
   ```bash
   npm run build
   ```
5. Iniciar la aplicación:
   ```bash
   npm run dev
   ```

El esquema de base de datos se inicializa de manera automática e idempotente en el arranque (`setupAulaActivaDatabase`), garantizando que si las tablas ya existen, no se pierdan datos.

