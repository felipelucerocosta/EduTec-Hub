# 🧪 EduTechHub — Guía del Entorno de Testing y Credenciales

Este documento contiene las credenciales oficiales de prueba y el flujo de testing completo para verificar el sistema antes de su instalación en el servidor del colegio.

---

## 🔑 1. Credenciales de Acceso

| Rol | Correo Electrónico | Contraseña | DNI | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador (Owner)** | `admin@edutechhub.edu.ar` | `Donpatricio111` | `ADM-OWNER-001` | Super Administrador |
| **Administrador (Testing)** | `admin.test@tecnica29de6.edu.ar` | `Donpatricio11123` | `ADM-TEST-002` | Administrador secundario |
| **Profesor de Prueba** | `profesor.prueba@tecnica29de6.edu.ar` | `12345678` | `PROF-TEST-001` | Profesor de Tecnología |
| **Alumno de Prueba** | `alumno.prueba@tecnica29de6.edu.ar` | `123456789` | `ALU-TEST-001` | Alumno inscripto |

---

## 🧹 2. Script de Limpieza y Reseteo de Base de Datos

Para restablecer la base de datos a un estado limpio con estas 4 cuentas y la clase de prueba inicial:

```bash
# Desde la raíz del proyecto
npm run clean:db:force

# O directamente con Node:
node backend/clean_database.js --yes
```

> **¿Qué hace la limpieza?**
> - Elimina todos los datos transaccionales (trabajos, entregas, calificaciones, mensajes, actas, archivos subidos).
> - Mantiene íntegra la estructura de tablas y relaciones de SQLite.
> - Recrea las 4 cuentas de testing.
> - Crea automáticamente la clase de prueba **"Programación 3ro A"** (Código: `PROG-TEST-2026`), asigna al Profesor de Prueba como titular e inscribe al Alumno de Prueba.

---

## 🔄 3. Flujo de Testing Paso a Paso (End-to-End)

Seguí este circuito para comprobar que todo el sistema funciona correctamente:

### Paso 1: Administrador — Gestión de la Estructura Escolar
1. Iniciá sesión con `felipelucero534@gmail.com` / `Donpatricio111`.
2. Accedé al **Panel Admin** desde el menú lateral (`/admin`).
3. Revisá las métricas del **Dashboard** (Alumnos, Profesores, Clases activas).
4. Entrá a **Clases** (`/admin/clases`):
   - Creá una nueva clase (ej: *Matemática 3ro B*).
   - Asigná un profesor como titular.
   - Inscribí alumnos a la clase.
5. Entrá a **Usuarios** (`/admin/usuarios`):
   - Consultá la lista filtrada por rol.
6. Cerrá sesión.

---

### Paso 2: Profesor — Publicación de Trabajo
1. Iniciá sesión como `profe.test@edutechhub.test` / `Profesor2026`.
2. En **Mis Clases**, ingresá a **Programación 3ro A**.
3. En la pestaña **Trabajos**, hacé clic en **Crear Trabajo**.
4. Completá:
   - **Título**: *TP 1: Introducción a Algoritmos*
   - **Descripción/Consigna**: *Desarrollar el diagrama de flujo y pseudocódigo del ejercicio 3.*
   - **Instrucciones**: *Subir archivo PDF o ZIP con el código fuente.*
   - **Puntaje Máximo**: *20 pts*
   - **Fecha Límite**: *Fecha futura*
5. Hacé clic en **Publicar Trabajo**.
6. Cerrá sesión.

---

### Paso 3: Alumno — Entrega de Trabajo y Consulta de Boletín
1. Iniciá sesión como `alumno.test@edutechhub.test` / `Alumno2026`.
2. En **Mis Clases**, abrí la clase **Programación 3ro A**.
3. En la lista de **Trabajos**, hacé clic sobre el trabajo publicado (*TP 1*).
4. Revisá la consigna completa, fecha límite y puntaje.
5. En el panel lateral derecho:
   - Adjuntá un archivo de prueba.
   - Escribí un comentario opcional (ej: *Entrega del TP1 adjunta.*).
   - Presioná **ENTREGAR TRABAJO**.
6. Verificá que el estado cambie a **Entregado** (con badge violeta).
7. Desde el menú lateral, abrí **Mi Boletín** (`/boletin`) y confirmá que se listan tus materias.
8. Cerrá sesión.

---

### Paso 4: Profesor — Corrección, Calificación y Feedback
1. Iniciá sesión como `profe.test@edutechhub.test` / `Profesor2026`.
2. Entrá a la clase **Programación 3ro A** → pestaña **Trabajos**.
3. En el trabajo correspondiente, hacé clic en **Ver Entregas y Calificar**.
4. Se abrirá la página dedicada de entregas:
   - Podés ver la consigna arriba.
   - En la tabla de alumnos, hacé clic en **Calificar** para el *Alumno de Prueba*.
   - Descargá el archivo entregado si deseás verificarlo.
   - Ingresá una nota (ej: `18` de `20`).
   - Escribí una devolución (ej: *Excelente planteo del algoritmo.*).
   - Presioná **Guardar Calificación**.
5. Verificá que la tabla actualice el estado a **Corregido** y la nota calculada.
6. Cerrá sesión.

---

### Paso 5: Alumno — Visualización de la Nota y Boletín
1. Iniciá sesión como `alumno.test@edutechhub.test` / `Alumno2026`.
2. Entrá al trabajo corregido:
   - Verificá la nota (`18 / 20`) y la devolución del profesor destacada en verde.
3. Entrá a **Mi Boletín**:
   - Comprobá que el promedio de la materia **Programación** se actualizó con la calificación real.
4. Cerrá sesión.

---

### Paso 6: Profesor — Rendimiento Académico y Exportación (PDF/Excel)
1. Iniciá sesión como `profe.test@edutechhub.test` / `Profesor2026`.
2. En el menú lateral, hacé clic en **Rendimiento** (`/rendimiento`).
3. Seleccioná la clase **Programación 3ro A**:
   - Pestaña **GENERAL**: Gráfico de evolución del curso, promedio general, porcentajes de aprobación.
   - Pestaña **POR ALUMNO**: Gráfico individual del *Alumno de Prueba* con su evolución nota a nota.
4. Probá los botones de exportación:
   - **Exportar Excel**: Descarga la planilla con los datos y promedios reales.
   - **Exportar PDF**: Abre el diálogo de impresión/guardado en PDF con formato limpio.

---

## 🛡️ 4. Reglas de Permisos y Seguridad Verificadas

- **Profesor**: Solo ve las clases donde es titular o creador asignado.
- **Alumno**: Solo ve las clases donde está inscripto y su propio boletín de calificaciones.
- **Admin**: Acceso completo al panel administrativo (`/admin`), estadísticas y gestión de usuarios/clases/asignaciones. No tiene funciones de alumno ni realiza correcciones como docente.
- **Rendimiento**: Sección exclusiva para docentes y administradores; no visible para el rol alumno.
