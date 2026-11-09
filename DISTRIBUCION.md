# 📦 EduTechHub — Guía de Distribución y Empaquetado

Este documento detalla el procedimiento para compilar, generar bundles de producción y empaquetar ejecutables nativos para Windows de **EduTechHub**.

---

## 🚀 1. Entorno de Desarrollo Local

```bash
# 1. Instalar dependencias raíz y backend
npm install
cd backend && npm install && cd ..

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env

# 3. Iniciar servidores de desarrollo concurrentes
npm run dev
```

- **Frontend:** `http://localhost:5173` (Vite)
- **Backend:** `http://localhost:3001` (Express API)

---

## 🏗️ 2. Verificación y Compilación de Producción

Antes de empaquetar, se debe verificar que ambos entornos compilen sin errores:

```bash
# 1. Chequeo de tipos del frontend
npm run typecheck

# 2. Compilación del backend a dist_backend/
npm run build:backend

# 3. Compilación del frontend con Vite a dist/
npm run build
```

---

## 💻 3. Generación del Ejecutable para Windows (`.exe`)

EduTechHub utiliza **Electron** y **Electron Builder** para generar instaladores NSIS y binarios portables.

### Ejecutar el empaquetador:
```bash
npm run build:exe
```

El script realiza los siguientes pasos de manera automatizada:
1. Compila el bundle de producción de React a `dist/`.
2. Compila el servidor TypeScript de Express a `dist_backend/`.
3. Empaqueta el runtime de Node, base de datos SQLite y assets en la carpeta `release/`.

### Archivos generados en `release/`:
- `EduTechHub Setup 1.0.0.exe` — Instalador guiado de Windows con acceso directo en escritorio e inicio.
- `EduTechHub-Portable.exe` — Versión portable ejecutable sin requerir privilegios de administrador.

---

## 🧹 4. Mantenimiento y Reseteo de Base de Datos

Para restablecer la base de datos a su estado limpio con las 7 cuentas de prueba:

```bash
# Modo interactivo (solicita confirmación):
npm run clean:db

# Modo directo (ideal para scripts de CI/CD o testing automatizado):
npm run clean:db:force
```

---

## 📜 5. Resumen de Scripts del Proyecto

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia backend y frontend en simultáneo con hot-reload |
| `npm run typecheck` | Chequea tipado estricto con TypeScript |
| `npm run build:backend` | Compila TypeScript del backend a JavaScript |
| `npm run build` | Genera el bundle estático de producción del frontend |
| `npm run build:exe` | Genera los binarios `.exe` en `release/` |
| `npm run clean:db` | Resetea la base de datos con confirmación |
| `npm run clean:db:force` | Resetea la base de datos inmediatamente |
