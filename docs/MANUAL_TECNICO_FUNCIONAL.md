# 📘 Manual Técnico y Funcional — EduTechHub

## Sistema de Gestión Educativa, Roles, Clases y Permisos

---

## 📑 Tabla de Contenidos
1. [Filosofía de Arquitectura y Principio Rector](#1-filosofía-de-arquitectura-y-principio-rector)
2. [Matriz de Roles y Niveles de Acceso](#2-matriz-de-roles-y-niveles-de-acceso)
3. [Ciclo de Vida de una Clase y Aislamiento de Divisiones](#3-ciclo-de-vida-de-una-clase-y-aislamiento-de-divisiones)
4. [Módulos Funcionales del Sistema](#4-módulos-funcionales-del-sistema)
   - [4.1 Dashboard según Rol](#41-dashboard-según-rol)
   - [4.2 Clases y Aulas Virtuales](#42-clases-y-aulas-virtuales)
   - [4.3 Trabajos Prácticos y Entregas](#43-trabajos-prácticos-y-entregas)
   - [4.4 Calificación y Feedback](#44-calificación-y-feedback)
   - [4.5 Materiales de Estudio](#45-materiales-de-estudio)
   - [4.6 Tablón de Anuncios y Foro](#46-tablón-de-anuncios-y-foro)
   - [4.7 Calendario Académico](#47-calendario-académico)
   - [4.8 Boletín y Rendimiento](#48-boletín-y-rendimiento)
5. [Seguridad y Control de Acceso Backend (RBAC)](#5-seguridad-y-control-de-acceso-backend-rbac)
6. [Modelo de Base de Datos y Relaciones](#6-modelo-de-base-de-datos-y-relaciones)
7. [Estados Vacíos y Experiencia de Usuario (UI/UX)](#7-estados-vacíos-y-experiencia-de-usuario-uiux)
8. [Matriz de Endpoints y Permisos](#8-matriz-de-endpoints-y-permisos)
9. [Guía de Testing y Cuentas de Prueba](#9-guía-de-testing-y-cuentas-de-prueba)

---

## 1. Filosofía de Arquitectura y Principio Rector

EduTechHub implementa una política de **visibilidad y autorización estricta**:

$$\text{Visibilidad} = \text{ROL} + \text{USUARIO} + \text{ASIGNACIÓN EXPLÍCITA} + \text{PERMISOS}$$

> ⚠️ **Regla Fundamental:**
> **EXISTIR EN LA BASE DE DATOS NO IMPLICA SER VISIBLE PARA EL USUARIO.**
> Ninguna clase, trabajo, material, anuncio o nota es visible por defecto para profesores o alumnos. La visibilidad requiere una relación de asignación verificable en la base de datos.

---

## 2. Matriz de Roles y Niveles de Acceso

| Capacidad / Módulo | Administrador (`admin`) | Profesor (`profesor`) | Alumno (`alumno`) |
| :--- | :---: | :---: | :---: |
| **Acceso a Panel Admin (`/admin`)** | ✅ Total | ❌ Denegado | ❌ Denegado |
| **Crear / Editar / Eliminar Clases** | ✅ Total | ❌ Solo Admin | ❌ Denegado |
| **Asignar Profesores y Alumnos** | ✅ Total | ❌ Solo Admin | ❌ Denegado |
| **Ver Clases en Mis Clases** | ✅ Todas | 🔍 Solo asignadas | 🔍 Solo inscriptas |
| **Crear Trabajos Prácticos** | ❌ Panel pedagógico | ✅ En sus clases | ❌ Solo consulta |
| **Entregar Trabajos** | ❌ No cursa | ❌ No cursa | ✅ En sus clases |
| **Calificar y dar Devolución** | ❌ No califica | ✅ En sus clases | ❌ Solo lectura |
| **Subir Materiales de Estudio** | ❌ No sube | ✅ En sus clases | ❌ Solo descarga |
| **Publicar Anuncios en Foro** | ✅ Global/Clase | ✅ En sus clases | ❌ Solo lectura |
| **Ver Rendimiento Académico** | ✅ Global | ✅ De sus clases | ❌ No disponible |
| **Ver Mi Boletín de Calificaciones** | ❌ Panel admin | ❌ Panel docente | ✅ Sus notas |

---

## 3. Ciclo de Vida de una Clase y Aislamiento de Divisiones

### 3.1 Ciclo de Creación y Asignación
```text
[Administrador crea Clase]
          ↓
  Clase registrada en BD
  - 0 Profesores asignados (titular_id = NULL)
  - 0 Alumnos inscriptos
          ↓
  Invisible para todos los docentes y estudiantes
          ↓
[Admin asigna Profesor titular / cotitular]
  → El profesor ve la clase en su Dashboard y Mis Clases
          ↓
[Admin inscribe Alumnos a la clase / división]
  → Los alumnos inscriptos ven la clase en su Dashboard
```

### 3.2 Aislamiento por División
Cada división escolar (**3ro 1ra**, **4to 2da**, **5to 1ra**, etc.) cuenta con sus **propias clases independientes**.
- La clase *Matemática 3ro 1ra* tiene un código y asignación única (`MAT-31-01`).
- La clase *Programación 4to 2da* tiene su propio código y asignación (`PRG-42-02`).
- Un alumno de 3ro 1ra **nunca** verá ni accederá a las clases de 4to 2da salvo que sea matriculado explícitamente.

---

## 4. Módulos Funcionales del Sistema

### 4.1 Dashboard según Rol
- **Admin**: Redirección automática a `/admin`. Muestra contadores de alumnos, profesores, materias, divisiones y accesos rápidos de gestión.
- **Profesor**: Muestra resumen de clases asignadas, tareas pendientes de corrección y avisos. Si tiene 0 clases, muestra un estado vacío con invitación a contactar al administrador.
- **Alumno**: Muestra materias inscriptas, próximos vencimientos de tareas, promedio general y accesos rápidos a simuladores y boletín.

### 4.2 Clases y Aulas Virtuales
- Consulta en vivo mediante `GET /api/profesor/mis-clases` (para profesores) y `GET /api/alumno/mis-clases` (para alumnos).
- Se eliminó cualquier persistencia en `localStorage` para evitar fuga de clases entre sesiones compartidas en el mismo navegador.

### 4.3 Trabajos Prácticos y Entregas
- **Profesor**: Crea trabajos especificando título, consigna, fecha límite, puntaje máximo e instrucciones opcionales.
- **Alumno**: Visualiza consigna y sube archivos adjuntos (PDF, ZIP, DOCX, imágenes) junto con comentarios.

### 4.4 Calificación y Feedback
- **Profesor**: Accede a la pantalla de entregas de su clase, descarga los archivos de los alumnos, asigna nota numérica (0-10 o personalizada) y redacta una devolución cualitativa.
- **Alumno**: Recibe notificación, visualiza su nota y la devolución del docente en su panel de entrega y en el boletín.

### 4.5 Materiales de Estudio
- Subida de archivos y enlaces por parte del docente asignado.
- Acceso de descarga exclusivo para alumnos matriculados en dicha clase.
- Control de eliminación restringido al profesor titular o creador del material.

### 4.6 Tablón de Anuncios y Foro
- Los anuncios y mensajes se vinculan a la clase correspondiente.
- Si un usuario no tiene clases asignadas, el foro muestra:
  > *"No tenés clases asignadas, por lo tanto no hay contenido para mostrar."*

### 4.7 Calendario Académico
- Agrega automáticamente las fechas límites de los trabajos prácticos de las clases asignadas al usuario activo.
- Notas personales protegidas por ID de usuario.

### 4.8 Boletín y Rendimiento
- **Boletín (Alumno)**: Lista las materias inscriptas con sus promedios calculados en tiempo real a partir de las entregas calificadas.
- **Rendimiento (Profesor)**: Muestra promedios grupales, gráficos de evolución temporal, desglose individual por alumno y exportación a Excel y PDF.

---

## 5. Seguridad y Control de Acceso Backend (RBAC)

El archivo `backend/permisos.ts` provee la función centralizada de verificación:

```typescript
export async function verificarAccesoClase(
  usuario: UsuarioSesion,
  claseId: number
): Promise<{ permitido: boolean; esAdmin: boolean; esProfesor: boolean; esAlumno: boolean }>
```

### Reglas de Autorización:
1. **Administrador (`rol === 'admin'` / `id === 1`)**: Acceso total concedido.
2. **Profesor (`rol === 'profesor'`)**: Acceso concedido **únicamente** si `clases.titular_id = profesor_id` O existe registro en `profesores_clases`.
3. **Alumno (`rol === 'alumno'`)**: Acceso concedido **únicamente** si existe registro en `alumnos_clases` vinculado a la clase o a su código.
4. **Respuesta no autorizada**: Devuelve código HTTP **403 Forbidden** con mensaje JSON explicativo.

---

## 6. Modelo de Base de Datos y Relaciones

### Tablas Principales:
```sql
-- Usuarios del sistema
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    rol TEXT CHECK(rol IN ('admin', 'profesor', 'alumno')),
    DNI TEXT,
    curso TEXT
);

-- Clases / Materias
CREATE TABLE clases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    seccion TEXT,
    materia TEXT,
    aula TEXT,
    creador TEXT,
    creador_id INTEGER,
    titular_id INTEGER,
    codigo TEXT UNIQUE NOT NULL,
    FOREIGN KEY (titular_id) REFERENCES usuarios(id)
);

-- Asignación de Profesores (Titulares / Cotitulares)
CREATE TABLE profesores_clases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profesor_id INTEGER NOT NULL,
    clase_id INTEGER NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profesor_id) REFERENCES usuarios(id),
    FOREIGN KEY (clase_id) REFERENCES clases(id)
);

-- Inscripción de Alumnos
CREATE TABLE alumnos_clases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    materia TEXT,
    codigo TEXT NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES usuarios(id),
    FOREIGN KEY (codigo) REFERENCES clases(codigo)
);
```

---

## 7. Estados Vacíos y Experiencia de Usuario (UI/UX)

Cuando un usuario no cuenta con asignaciones activas, la plataforma muestra estados informativos y amigables:

1. **Profesor sin clases**:
   - Mensaje: *"No tienes clases asignadas"*
   - Subtexto: *"Aún no se te ha asignado ninguna clase. Contacta al administrador institucional."*
2. **Alumno sin clases**:
   - Mensaje: *"No estás inscripto en ninguna clase"*
   - Subtexto: *"Solicita a tu preceptor o profesor el código de inscripción o comunícate con secretaría."*
3. **Foro sin clases**:
   - Mensaje: *"No tenés clases asignadas, por lo tanto no hay contenido para mostrar."*

---

## 8. Matriz de Endpoints y Permisos

| Endpoint | Método | Roles Permitidos | Validación RBAC |
| :--- | :---: | :---: | :--- |
| `/api/clases` | `GET` | Todos | Filtra por asignación según rol |
| `/api/clases/:id` | `GET` | Todos | 403 si no pertenece a la clase |
| `/api/profesor/mis-clases` | `GET` | `profesor`, `admin` | Clases donde es titular/asignado |
| `/api/alumno/mis-clases` | `GET` | `alumno`, `admin` | Clases donde está matriculado |
| `/api/clases/:claseId/trabajos` | `GET`, `POST` | Todos | 403 si no pertenece a la clase |
| `/api/trabajos/:id` | `GET`, `PUT`, `DELETE` | Todos | 403 / solo profesor titular edita |
| `/api/materiales/:claseId` | `GET`, `POST` | Todos | 403 si no pertenece a la clase |
| `/api/entregas/:trabajoId` | `POST` | `alumno` | 403 si no pertenece a la clase del trabajo |
| `/api/calificar` | `POST` | `profesor`, `admin` | 403 si no es docente de la clase |
| `/api/rendimiento/clase/:claseId` | `GET` | `profesor`, `admin` | 403 si no es docente de la clase |

---

## 9. Guía de Testing y Cuentas de Prueba

### Credenciales de Testing:
- **Admin**: `admin@edutechhub.edu.ar` | `Donpatricio111`
- **Profesor Matemática (3ro 1ra)**: `profesor.matematica@tecnica29de6.edu.ar` | `12345678`
- **Profesor Programación (4to 2da)**: `profesor.programacion@tecnica29de6.edu.ar` | `12345678`
- **Profesor Sin Asignar (Vacío)**: `profesor.sinclase@tecnica29de6.edu.ar` | `12345678`
- **Alumno 3ro 1ra**: `alumno.3ro1ra@tecnica29de6.edu.ar` | `123456789`
- **Alumno 4to 2da**: `alumno.4to2da@tecnica29de6.edu.ar` | `123456789`
- **Alumno Sin Clases (Vacío)**: `alumno.sinclase@tecnica29de6.edu.ar` | `123456789`

### Comandos de Reseteo:
```bash
# Limpiar y regenerar base de datos de testing
node backend/clean_database.js --yes
```
