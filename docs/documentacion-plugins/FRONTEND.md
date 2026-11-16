# Documentación Técnica del Frontend de Plugins (TECH-ROOM 29)

Este documento detalla la arquitectura de interfaz de usuario, los componentes React, el flujo de eventos, la comunicación con el backend y el sistema de diseño visual empleado en los plugins de **EduTec-Hub**.

---

## 1. Arquitectura de la Interfaz

### 1.1 Estructura Modular y Desacoplada
El frontend de cada plugin se aloja en su propia carpeta `frontend/` y se conecta de manera transparente al sistema base:

```
plugins/
├── edutech-preceptoria/frontend/
│   ├── services/preceptoria_api.ts           <-- Cliente de red (Fetch API tipado)
│   ├── pages/PreceptoriaPage.tsx             <-- Orquestador de vistas según rol
│   ├── styles/preceptoria.module.css         <-- Estilos encapsulados con CSS Modules
│   └── components/                           <-- Vistas atómicas especializadas
│       ├── AsistenciasAlumnoView.tsx
│       ├── PreceptoriaTomaAsistenciaView.tsx
│       ├── PreceptoriaConstanciasView.tsx
│       ├── PreceptoriaAlumnosView.tsx
│       ├── PreceptoriaRendimientoClasesView.tsx
│       ├── AsistenciasDocenteView.tsx
│       └── AdminAsistenciasDocentesView.tsx
│
└── edutech-oportunidades/frontend/
    ├── services/oportunidades_api.ts         <-- Cliente de red
    ├── pages/OportunidadesPage.tsx           <-- Orquestador de vistas
    ├── styles/oportunidades.module.css       <-- Estilos encapsulados
    └── components/
        ├── OportunidadesExplorarView.tsx
        ├── MisPostulacionesView.tsx
        └── GestionResponsableView.tsx
```

---

### 1.2 Patrones de Diseño Utilizados en el Frontend

1. **Patrón Contenedor y Presentación (Container & Presentational Components)**:
   - `PreceptoriaPage.tsx` y `OportunidadesPage.tsx` actúan como contenedores inteligentes: consultan el contexto de autenticación (`useAuth()`), determinan el rol del usuario y administran la navegación interna por pestañas.
   - Las vistas hijas (`AsistenciasAlumnoView`, `PreceptoriaTomaAsistenciaView`, etc.) se concentran en renderizar los datos y capturar los eventos del usuario.
2. **Encapsulamiento de Estilos con CSS Modules**:
   - Cada plugin tiene su archivo `.module.css`, garantizando que las clases de estilos no colisionen con las clases globales de la plataforma EduTec-Hub.
3. **Manejo de Estados de Carga y Vacíos (Empty & Loading States)**:
   - Toda llamada asíncrona implementa indicadores visuales de progreso (spinners de carga) y vistas pedagógicas cuando no existen registros aún.

---

## 2. Componentes de EduTech Preceptoría

### 2.1 Orquestador: [`PreceptoriaPage.tsx`](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-preceptoria/frontend/pages/PreceptoriaPage.tsx)
- **Función**: Evalúa las propiedades del usuario conectado mediante el hook `useAuth()`.
- **Lógica de Roles**:
  - `user.rol === 'alumno'`: Renderiza de forma directa la vista informativa de presentismo escolar (`AsistenciasAlumnoView`).
  - `user.rol === 'profesor'`: Renderiza la vista de asistencia laboral docente (`AsistenciasDocenteView`).
  - `user.rol === 'preceptor'`: Habilita la barra de pestañas completa (Nómina de Alumnos, Rendimiento, Constancias, Asistencia Docente y Toma Diaria).
  - `user.rol === 'admin'`: Habilita la supervisión directiva y asignaciones de comisiones.

---

### 2.2 Vista del Alumno: [`AsistenciasAlumnoView.tsx`](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-preceptoria/frontend/components/AsistenciasAlumnoView.tsx)
- **Propósito**: Ofrecer al estudiante una visión clara, transparente y en tiempo real de su situación académica de asistencia.
- **Métricas Renderizadas**:
  1. *Total de Inasistencias*: Conteo de faltas no justificadas.
  2. *Presentes y Justificados*: Asistencias que suman para el porcentaje de regularidad.
  3. *Tardanzas*: Asistencias con llegada posterior al toque de timbre.
  4. *Porcentaje Global*: Indicador circular animado ($0\%$ a $100\%$).
  5. *Condición de Regularidad*: Badge verde si es $\ge 75\%$ ("Regular"), badge rojo si es $< 75\%$ ("No regular").
- **Historial Detallado**: Tabla cronológica que especifica fecha, asignatura y estado.
- **Solicitud de Constancias**: Botón que despliega un modal interactivo para solicitar certificado de alumno regular con motivo personal.
- **Tratamiento del Estado Vacío**: Si `totalSesiones === 0`, renderiza un estado informativo pedagógico:
  > *"Sin registros de presentismo aún — Tu preceptoría aún no ha asentado jornadas de asistencia para tus comisiones. Las asistencias oficiales aparecerán aquí automáticamente en tiempo real."*

---

### 2.3 Planilla de Toma de Asistencia: [`PreceptoriaTomaAsistenciaView.tsx`](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-preceptoria/frontend/components/PreceptoriaTomaAsistenciaView.tsx)
- **Propósito**: Herramienta de alta velocidad para que el preceptor tome lista en segundos.
- **Flujo de Interacción**:
  1. El preceptor selecciona la comisión escolar en un menú desplegable.
  2. Selecciona la fecha mediante un selector de calendario (por defecto la fecha de hoy).
  3. El componente invoca `PreceptoriaAPI.getPlanillaFecha(claseId, fecha)`.
  4. Renderiza a cada estudiante con 4 botones rápidos de selección:
     - **[P] Presente** (Verde esmeralda)
     - **[A] Ausente** (Rojo carmesí)
     - **[T] Tarde** (Ámbar)
     - **[J] Justificado** (Azul cian)
  5. El preceptor puede marcar cambios individuales o usar el botón *"Marcar todos Presentes"*.
  6. Al hacer clic en *"Guardar Asistencia"*, se envía el payload al backend, se emite una notificación *Toast* de confirmación y se disparan los eventos WebSockets.

---

### 2.4 Gestión de Constancias: [`PreceptoriaConstanciasView.tsx`](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-preceptoria/frontend/components/PreceptoriaConstanciasView.tsx)
- **Propósito**: Bandeja de entrada para que el preceptor apruebe o rechace solicitudes de constancia de alumno regular.
- **Acciones Disponibles**:
  - *Aprobar*: El backend genera un código de verificación institucional (ej. `CAR-2026-X7K2A9`) e imprime la fecha de resolución.
  - *Rechazar*: Permite ingresar un motivo de rechazo (ej. "Inasistencias superiores al límite permitido").
  - *Emisión Directa*: Permite emitir una constancia en el acto para un alumno sin requerir solicitud web previa.

---

## 3. Componentes de EduTech Oportunidades

### 3.1 Orquestador: [`OportunidadesPage.tsx`](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-oportunidades/frontend/pages/OportunidadesPage.tsx)
Administra la navegación interna mediante 3 pestañas:
1. **Explorar Convocatorias** (Disponible para todos los usuarios).
2. **Mis Postulaciones** (Exclusiva para el rol alumno).
3. **Gestión de Convocatorias** (Disponible para profesores, preceptores y administradores).

---

### 3.2 Catálogo de Convocatorias: [`OportunidadesExplorarView.tsx`](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-oportunidades/frontend/components/OportunidadesExplorarView.tsx)
- **Filtros Reactivos**: Selector de categoría técnica (Computación, Electrónica, Mecánica, Construcciones, etc.), modalidad (Presencial, Remoto, Híbrido) y barra de búsqueda textual en tiempo real.
- **Tarjetas de Convocatoria**:
  - Título del puesto y nombre de la institución o empresa patrocinante.
  - Insignia de modalidad y tipo de oportunidad (Pasantía, Beca, Proyecto).
  - Contador visual de vacantes disponibles ($x$ de $y$ ocupadas).
  - Fecha límite de inscripción con advertencia si faltan pocos días para el cierre.
- **Modal de Postulación**: Formulario con validación en cliente donde el alumno redacta su presentación, motivación y disponibilidad horaria.

---

### 3.3 Seguimiento de Postulaciones: [`MisPostulacionesView.tsx`](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-oportunidades/frontend/components/MisPostulacionesView.tsx)
- **Propósito**: Permite al alumno hacer seguimiento del estado de cada postulación enviada.
- **Estados Visualizados**:
  - `Pendiente` (Amarillo): Solicitud enviada, pendiente de revisión.
  - `En evaluación` (Azul): El docente responsable está analizando el perfil.
  - `Entrevista` (Púrpura): El postulante fue preseleccionado para una entrevista presencial o remota.
  - `Aceptada` (Verde): El estudiante fue seleccionado para cubrir la vacante.
  - `Rechazada` (Rojo): La postulación fue desestimada, con devolución pedagógica en las notas del responsable.

---

### 3.4 Gestión Docente / Directiva: [`GestionResponsableView.tsx`](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-oportunidades/frontend/components/GestionResponsableView.tsx)
- **Publicación de Búsquedas**: Formulario completo para dar de alta pasantías o proyectos con fecha de apertura, fecha de cierre, vacantes y requisitos técnicos.
- **Panel de Aspirantes**: Despliega la nómina de estudiantes postulados a cada búsqueda, permitiendo leer sus cartas de presentación y resolver su postulación con un clic (*Aceptar*, *Rechazar*, *Entrevista*).

---

## 4. Estilos y Sistema Visual Espacial

Ambos plugins se adhieren al lenguaje de diseño espacial de **TECH-ROOM 29**:
- **Paleta de Colores**:
  - Fondo oscuro profundo: `#0b0d1a` y `#0d1222`.
  - Bordes translúcidos violetas: `rgba(151, 71, 255, 0.15)`.
  - Color primario institucional: Violeta neón (`var(--primary)` o `#7929d2`).
  - Colores semánticos de estado:
    - Presente / Aceptada: Esmeralda `#10b981`.
    - Ausente / Rechazada: Carmesí `#ef4444`.
    - Tarde / Pendiente: Ámbar `#f59e0b`.
    - Justificado / Evaluación: Cian `#06b6d4`.
- **Tipografía**: Fuentes modernas sin serifa para legibilidad técnica (`Inter`, `system-ui`).
- **Iconografía**: Conjunto oficial de iconos de Boxicons (`bx-*`).
