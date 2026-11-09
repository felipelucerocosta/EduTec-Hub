# 🧪 EduTechHub — Guía del Entorno de Testing y Credenciales

Este documento contiene las credenciales oficiales de prueba y el flujo de testing para verificar el aislamiento estricto de roles, clases independientes por división y permisos en EduTechHub.

---

## 🔑 1. Credenciales de Acceso

| Rol | Correo Electrónico | Contraseña | DNI | División / Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador General** | `admin@edutechhub.edu.ar` | `Donpatricio111` | `ADM-001` | Todas las divisiones |
| **Administrador / Dueño** | `felipelucero534@gmail.com` | `Donpatricio111` | `ADM-OWNER-001` | Todas las divisiones |
| **Profesor de Matemática** | `profesor.matematica@tecnica29de6.edu.ar` | `12345678` | `PROF-MAT-001` | Asignado a **3ro 1ra** |
| **Profesor de Programación** | `profesor.programacion@tecnica29de6.edu.ar` | `12345678` | `PROF-PRG-002` | Asignado a **4to 2da** |
| **Profesor Sin Asignar** | `profesor.sinclase@tecnica29de6.edu.ar` | `12345678` | `PROF-VAC-003` | **0 clases asignadas** (Estado Vacío) |
| **Alumno 3ro 1ra** | `alumno.3ro1ra@tecnica29de6.edu.ar` | `123456789` | `ALU-31-001` | Inscripto en **3ro 1ra** |
| **Alumno 4to 2da** | `alumno.4to2da@tecnica29de6.edu.ar` | `123456789` | `ALU-42-002` | Inscripto en **4to 2da** |
| **Alumno Sin Clases** | `alumno.sinclase@tecnica29de6.edu.ar` | `123456789` | `ALU-VAC-003` | **0 clases inscriptas** (Estado Vacío) |

---

## 🏫 2. Estructura de Clases y Divisiones Independientes

Las divisiones son totalmente independientes y no comparten clases:

| Clase | División | Código | Profesor Titular | Alumnos Inscriptos |
| :--- | :--- | :--- | :--- | :--- |
| **Matemática 3ro 1ra** | 3ro 1ra | `MAT-31-01` | Profesor de Matemática | Alumno Tres Uno (`alumno.3ro1ra@...`) |
| **Programación 4to 2da** | 4to 2da | `PRG-42-02` | Profesor de Programación | Alumno Cuatro Dos (`alumno.4to2da@...`) |
| **Redes 5to 1ra** | 5to 1ra | `RED-51-03` | *Sin asignar (0 profesores)* | *Sin asignar (0 alumnos)* |

---

## 🧹 3. Script de Limpieza y Reseteo de Base de Datos

Para restablecer la base de datos a este estado limpio con las cuentas y divisiones independientes:

```bash
# Desde la carpeta backend:
node clean_database.js --yes
```

> **¿Qué hace la limpieza?**
> - Elimina todos los datos transaccionales (trabajos, entregas, calificaciones, mensajes, notificaciones, archivos subidos).
> - Mantiene íntegra la estructura de tablas y relaciones SQLite.
> - Recrea las 7 cuentas de testing aisladas.
> - Asigna las clases independientes a cada división y deja la clase *Redes 5to 1ra* y las cuentas *sinclase* limpias para pruebas de asignación.

---

## 🔄 4. Escenarios de Prueba de Aislamiento y Roles

### Escenario A: Profesor Sin Clases (Estado Vacío Real)
1. Iniciar sesión como `profesor.sinclase@tecnica29de6.edu.ar` / `12345678`.
2. Verificar en el **Dashboard**: Muestra "No tienes clases asignadas".
3. Verificar en **Mis Clases**: Lista vacía con botón para solicitar asignación.
4. Verificar en **Foro**: Muestra *"No tenés clases asignadas, por lo tanto no hay contenido para mostrar."*.
5. Verificar en **Rendimiento**: Muestra mensaje de que no hay clases asociadas.

### Escenario B: Alumno Sin Clases (Estado Vacío Real)
1. Iniciar sesión como `alumno.sinclase@tecnica29de6.edu.ar` / `123456789`.
2. Verificar en el **Dashboard**: Contador de clases en 0.
3. Verificar en **Mis Clases**: Mensaje informando que no está inscripto en ninguna materia.
4. Verificar en **Boletín / Trabajos**: Lista vacía sin errores.

### Escenario C: Aislamiento entre Divisiones (3ro 1ra vs 4to 2da)
1. Iniciar sesión como `alumno.3ro1ra@tecnica29de6.edu.ar` / `123456789`.
2. Confirmar que **SOLO** ve *Matemática 3ro 1ra* (`MAT-31-01`).
3. Cerrar sesión e iniciar como `alumno.4to2da@tecnica29de6.edu.ar` / `123456789`.
4. Confirmar que **SOLO** ve *Programación 4to 2da* (`PRG-42-02`).
5. Iniciar sesión como `profesor.matematica@tecnica29de6.edu.ar` / `12345678`:
   - En **Mis Clases** solo figura *Matemática 3ro 1ra*.
   - No tiene visibilidad ni acceso a *Programación 4to 2da*.

### Escenario D: Administrador — Asignación Limpia
1. Iniciar sesión como `admin@edutechhub.edu.ar` / `Donpatricio111`.
2. Redirige automáticamente al Panel Admin (`/admin`).
3. En **Clases**, entrar a *Redes 5to 1ra* (que tiene 0 profesores y 0 alumnos).
4. Asignar al `profesor.sinclase@tecnica29de6.edu.ar` como titular y al `alumno.sinclase@tecnica29de6.edu.ar` como alumno.
5. Iniciar sesión con `profesor.sinclase@tecnica29de6.edu.ar` y verificar que la clase ahora aparece de inmediato en su panel.

---

## 🛡️ 5. Reglas de Seguridad Backend (RBAC)

- **403 Forbidden**: Si un usuario intenta acceder vía URL o API a una clase no asignada (ej: `GET /api/clases/:id/trabajos` o `GET /api/materiales/:claseId`), el backend responde con error 403.
- **Sin fugas por localStorage**: El frontend no almacena listas de clases en localStorage; todos los datos se consultan y validan en vivo con la sesión del usuario.
