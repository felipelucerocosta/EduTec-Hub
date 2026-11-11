# REPORTE DE LIMPIEZA CONTROLADA DE CUENTAS DE PRUEBA
## EduTech-Hub — Prácticas Profesionalizantes
**Fecha de Ejecución:** 9 de Noviembre de 2026  
**Entorno:** Base de Datos Embebida SQLite (`database/edutechhub.sql`)  
**Script Ejecutado:** `backend/cleanup_test_accounts.js`

---

## 1. Objetivo de la Operación
Preparar la plataforma EduTech-Hub para la demostración académica en clase mediante la depuración de datos de prueba acumulados (estudiantes y docentes ficticios), preservando con rigor absoluto todas las cuentas administrativas institucionales y la totalidad de la estructura de cursos, divisiones y materias.

---

## 2. Acciones Previas y Respaldo de Seguridad
Antes de ejecutar cualquier sentencia destructiva:
1. Se generó una copia de respaldo completa e inmutable:
   - Archivo de backup: `database/edutechhub.sql.backup-pre-cleanup` (147.456 bytes).
2. Se analizaron las dependencias foráneas y se verificó que `PRAGMA foreign_keys = ON;` estuviese activo.
3. Se protegió el archivo `backend/setup_db.ts` para que la bandera `SEED_TEST_USERS` impida la reaparición no deseada de las cuentas depuradas al reiniciar el servidor.

---

## 3. Cuentas Administrativas Conservadas (Intactas)

| ID | Correo Electrónico | Nombre y Apellido | DNI | Rol | Estado de Acceso | Observaciones |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **1** | `admin@edutechhub.edu.ar` | Administrador General | `ADM-001` | `admin` | `ACTIVO` | Cuenta principal institucional |
| **10** | `felipelucero534@gmail.com` | Felipe Lucero | `ADM-OWNER-001` | `admin` | `ACTIVO` | Administrador de infraestructura |
| **11** | `felipe.lucero.617@alu.tecnica29de6.edu.ar` | Felipe Lucero | `ADM-FELIPE-001` | `admin` | `ACTIVO` | Cuenta administrativa institucional |
| **12** | `thiago.said.489@alu.tecnica29de6.edu.ar` | Administrador del Sistema | `ADM-ENV-001` | `admin` | `ACTIVO` | Administrador de entorno testing |

*Nota de seguridad:* Las contraseñas, hashes criptográficos bcrypt, DNIs y permisos de estas 4 cuentas permanecieron inalterados.

---

## 4. Cuentas de Prueba Depuradas (Eliminadas)

Se eliminaron exactamente **16 cuentas de prueba** no administrativas:

| ID | Correo Electrónico | Nombre Completo | Rol | DNI | Motivo de Eliminación |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **2** | `profesor.matematica@tecnica29de6.edu.ar` | Profesor de Matemática | `profesor` | `PROF-MAT-001` | Cuenta docente de prueba |
| **3** | `profesor.programacion@tecnica29de6.edu.ar` | Profesor de Programación | `profesor` | `PROF-PRG-002` | Cuenta docente de prueba |
| **4** | `profesor.sinclase@tecnica29de6.edu.ar` | Profesor Sin Asignar | `profesor` | `PROF-VAC-003` | Cuenta docente de prueba |
| **5** | `alumno.3ro1ra@tecnica29de6.edu.ar` | Alumno Tres Uno | `alumno` | `ALU-31-001` | Cuenta estudiante de prueba |
| **6** | `alumno.4to2da@tecnica29de6.edu.ar` | Alumno Cuatro Dos | `alumno` | `ALU-42-002` | Cuenta estudiante de prueba |
| **7** | `alumno.sinclase@tecnica29de6.edu.ar` | Alumno Sin Clases | `alumno` | `ALU-VAC-003` | Cuenta estudiante de prueba |
| **8** | `profesor@tecnica29.edu.ar` | Profesor | `profesor` | `DNI-56942450` | Cuenta docente residual |
| **9** | `demo@edutech.edu.ve` | Demo | `alumno` | `DNI-13672304` | Cuenta estudiante residual |
| **13** | `profesor.redes@tecnica29de6.edu.ar` | Prof. Martín Redes | `profesor` | `PROF-RED-03` | Cuenta docente de prueba |
| **14** | `profesor.sistemas@tecnica29de6.edu.ar` | Prof. Roberto Sistemas | `profesor` | `PROF-SIS-04` | Cuenta docente de prueba |
| **15** | `profesor.prueba@tecnica29de6.edu.ar` | Profesor Técnico | `profesor` | `PROF-PRUEBA-001` | Cuenta docente de prueba |
| **16** | `alumno.5to1ra@tecnica29de6.edu.ar` | Lucas Rodríguez | `alumno` | `ALU-51-003` | Cuenta estudiante de prueba |
| **17** | `alumno.6to1ra@tecnica29de6.edu.ar` | Valentina López | `alumno` | `ALU-61-004` | Cuenta estudiante de prueba |
| **18** | `alumno.prueba@tecnica29de6.edu.ar` | Alumno de Prueba | `alumno` | `ALU-PRUEBA-001` | Cuenta estudiante de prueba |
| **19** | `dylan.melgarejo2005@gmail.com` | dylan diaz | `alumno` | `46346763` | Cuenta estudiante de prueba |
| **20** | `admin@edutechub.edu.ar` | Admin | `alumno` | `DNI-45954107` | Cuenta residual con error tipográfico |

---

## 5. Integridad y Estructura Académica Preservada
- **Divisiones Escolares (Tabla `curso`):** Las 60 divisiones oficiales (1ro 1ra a 6to 10ma) se conservaron intactas.
- **Materias y Comisiones (Tabla `clases`):** Las 7 clases institucionales permanecieron intactas, desvinculando limpiamente a los docentes de prueba eliminados (`titular_id = NULL`) para permitir nuevas asignaciones docentes reales durante la clase.
- **Trabajos Prácticos y Materiales:** Se conservaron las actividades base asignando la autoría al Administrador Institucional (`id_usuario = 1`).
- **Verificación de Claves Foráneas:** Se ejecutó `PRAGMA foreign_key_check;` arrojando **0 inconsistencias**.

