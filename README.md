# 🎓 EduTechHub — Plataforma de Gestión Educativa para Escuelas Técnicas

EduTechHub es una plataforma integral de gestión educativa y aula virtual diseñada para escuelas técnicas secundarias. Proporciona control de acceso basado en roles (**RBAC**), gestión independiente de clases por división, seguimiento de rendimiento académico, entrega y corrección de trabajos prácticos, simuladores técnicos interactivos y asistencia con Alfred.

---

## 🚀 Características Principales

- 🔐 **Control de Acceso Basado en Roles (RBAC):**
  - **Administrador:** Gestión total de usuarios, roles, creación de clases, asignación de docentes/alumnos y auditoría.
  - **Profesor:** Gestión de trabajos prácticos, corrección con devoluciones, subida de recursos didácticos y análisis de rendimiento de sus cursos asignados.
  - **Alumno:** Entrega de tareas, visualización de calificaciones, boletín de períodos académicos, acceso a simuladores y foro de debate.
- 🏫 **Aislamiento Estricto de Clases por División:**
  - Las clases nuevas nacen con 0 profesores y 0 alumnos hasta ser asignadas por el administrador.
  - Las divisiones (3ro 1ra, 4to 2da, 5to 1ra, etc.) no comparten contenido ni matriculaciones por defecto.
- 📊 **Seguimiento del Rendimiento Académico y Boletín:**
  - Gráficos interactivos de evolución temporal, tasas de aprobación y promedios automáticos agrupados por períodos académicos.
- 🧪 **Simuladores Técnicos:**
  - Simuladores interactivos integrados para especialidades técnicas (circuitos, programación, lógica digital, etc.).
- 🤖 **Asistente Alfred:**
  - Generación y recuperación segura de credenciales institucionales mediante códigos de verificación de un solo uso.
- 💻 **Multiplataforma:**
  - Aplicación Web responsiva y empaquetado para escritorio en Windows mediante Electron.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, React Router 7, Vanilla CSS Modules, Socket.io-client |
| **Backend** | Node.js, Express, TypeScript, Express-Session, Bcrypt, Multer, Socket.io |
| **Base de Datos** | SQLite3 / PostgreSQL compatible (`conexion_pg.ts` con pool transaccional) |
| **Escritorio** | Electron, Electron Builder (generación de instalador NSIS y Portable `.exe`) |

---

## 📦 Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** >= 18.x
- **npm** >= 9.x

### 1. Clonar e Instalar Dependencias
```bash
# Clonar el repositorio
git clone https://github.com/felipelucerocosta/EduTec-Hub.git
cd EduTec-Hub

# Instalar dependencias raíz y backend
npm install
cd backend && npm install && cd ..
```

### 2. Configurar Variables de Entorno
```bash
# Crear .env en la carpeta backend
cp backend/.env.example backend/.env
```

Configurar en `backend/.env`:
```env
PORT=3001
SESSION_SECRET=tu_clave_secreta_super_segura
NODE_ENV=development
ADMIN_EMAIL=admin@edutechhub.edu.ar
ADMIN_PASSWORD=Donpatricio111
```

### 3. Iniciar el Entorno de Desarrollo
```bash
# Inicia Frontend (Vite :5173) y Backend (Express :3001) concurrentemente
npm run dev
```

Acceder desde el navegador a: **`http://localhost:5173`**

---

## 📜 Scripts Disponibles

| Script | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia backend y frontend en paralelo con recarga en vivo |
| `npm run typecheck` | Ejecuta verificación estricta de tipos de TypeScript en el frontend |
| `npm run build:backend` | Compila el backend TypeScript a `dist_backend/` |
| `npm run build` | Compila el frontend con Vite a la carpeta `dist/` |
| `npm run clean:db` | Script interactivo para limpiar y sembrar datos de prueba |
| `npm run clean:db:force` | Resetea la base de datos de testing sin solicitar confirmación |
| `npm run build:exe` | Genera el instalador `.exe` para Windows vía Electron |

---

## 📚 Documentación Adicional

- [📘 Manual Técnico y Funcional](docs/MANUAL_TECNICO_FUNCIONAL.md) — Explicación profunda de la arquitectura, modelos de base de datos, RBAC y endpoints.
- [🧪 Guía de Testing y Credenciales](TESTING_CREDENTIALS.md) — Lista oficial de cuentas de prueba por rol y división.
- [📦 Guía de Distribución](DISTRIBUCION.md) — Pasos para compilación y despliegue del binario ejecutable.

---

## 👥 Equipo y Créditos

Desarrollado con pasión para la comunidad educativa técnica por **The Twisted Techlands**.
