# Arquitectura y Estructura del Sistema de Plugins de EduTech

## 1. Visión General
EduTech implementa un sistema modular de plugins desacoplados que extienden las capacidades pedagógicas e institucionales de la plataforma sin intervenir el núcleo monolítico (`core`).

Los plugins se montan de forma dinámica bajo el prefijo:
`/api/plugins/<id-del-plugin>`

Cada plugin cuenta con:
- Un **Manifiesto Oficial** (`PluginManifest`) que define metadatos (`id`, `name`, `version`, `baseRoute`, `enabled`).
- Un **Enrutador Express** propio (`router`).
- Un método de inicialización idempotente (`initialize`) que genera o migra sus tablas de base de datos sin afectar a las existentes.
- Servicios independientes (`services`) y controladores (`controllers`).
- Componentes y vistas completas para el Frontend (`frontend/`).

```
plugins/
├── plugin_types.ts                     # Contratos TypeScript de plugins
├── index.ts                            # PluginRegistry (Registro Central)
│
├── asistencia-academica/               # Plugin 1: Asistencia y Regularidad
│   ├── backend/
│   └── frontend/
│
├── aula-activa/                        # Plugin 2: Aula Activa
│   ├── package.json
│   ├── backend/
│   │   ├── index.ts                    # Manifiesto y export
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── database/
│   └── frontend/
│       ├── services/
│       ├── components/
│       ├── pages/
│       └── styles/
│
└── oportunidades/                      # Plugin 3: Oportunidades
    ├── package.json
    ├── backend/
    │   ├── index.ts                    # Manifiesto y export
    │   ├── controllers/
    │   ├── services/
    │   │   ├── oportunidades_service.ts
    │   │   └── email_service.ts        # Integración SMTP / Correo
    │   ├── routes/
    │   └── database/
    └── frontend/
        ├── services/
        ├── components/
        ├── pages/
        └── styles/
```

---

## 2. Procedimiento de Instalación y Activación

### Registro en el Backend:
Para registrar un nuevo plugin, se agrega una instancia de `BackendPlugin` al `PluginRegistry` en `plugins/index.ts`:

```typescript
import { pluginRegistry } from './index';
import aulaActivaPlugin from './aula-activa/backend/index';
import oportunidadesPlugin from './oportunidades/backend/index';

pluginRegistry.register(aulaActivaPlugin);
pluginRegistry.register(oportunidadesPlugin);
```

Cuando el servidor Express inicia (`server.ts`), ejecuta:
```typescript
await pluginRegistry.mountAll(app);
```
Esto asegura que las tablas se verifiquen y se creen con `IF NOT EXISTS` y que los enrutadores queden asociados a `/api/plugins/<id>`.

### Desactivación:
Para desactivar un plugin basta con establecer `enabled: false` en su manifiesto o comentar su registro. Las tablas y datos persisten en la base de datos sin pérdida de información histórica.

