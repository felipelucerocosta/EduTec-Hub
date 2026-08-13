# EduTechHub — Guía de Distribución

## 🚀 Inicio Rápido (Desarrollo)

```bash
npm install
cd backend && npm install && cd ..
copy backend\.env.example backend\.env
# Editar backend\.env con tus valores
npm run dev
```

Abre **http://localhost:5173**.

---

## 👤 Administradores

Configurar en `backend/.env`:

```env
ADMIN_EMAIL=tu@correo.com
ADMIN_PASSWORD=TuContraseñaSegura
```

Admin fijo adicional: `felipelucero534@gmail.com`

---

## 🧹 Limpiar Base de Datos

```bash
npm run clean:db          # interactivo (escribe "LIMPIAR")
npm run clean:db:force    # sin confirmación
```

Elimina todos los datos de prueba. Deja solo los 2 admins.

---

## 📦 Build

```bash
npm run build       # bundle web en dist/
npm run build:exe   # ejecutable Windows en release/
```

El ejecutable requiere: `npm install -D electron electron-builder`

---

## 🔧 Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Frontend + backend en paralelo |
| `npm run typecheck` | Verifica TypeScript |
| `npm run build` | Build de producción |
| `npm run clean:db` | Limpia BD (confirmación) |
| `npm run clean:db:force` | Limpia BD sin confirmación |
| `npm run build:exe` | Genera .exe Windows |

---

## 🏗️ Arquitectura

- **Frontend:** React + Vite → puerto 5173
- **Backend:** Express + TypeScript → puerto 3001
- **Base de datos:** SQLite embebida en `database/edutechhub.sql`
- **Auth:** express-session + cookies httpOnly (7 días)
