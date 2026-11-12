# Modelo de Datos — EduTech Oportunidades

## 1. Entidades del Plugin

### Tabla: `plugin_oportunidades`
Almacena las convocatorias institucionales publicadas en EduTech.

```sql
CREATE TABLE IF NOT EXISTS plugin_oportunidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    institucion TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tipo_oportunidad TEXT NOT NULL DEFAULT 'pasantia',
    requisitos TEXT,
    conocimientos TEXT,
    nivel_educativo TEXT DEFAULT 'secundario_tecnico',
    vacantes_totales INTEGER NOT NULL DEFAULT 1,
    vacantes_ocupadas INTEGER NOT NULL DEFAULT 0,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_apertura DATE,
    fecha_cierre_inscripcion DATE NOT NULL,
    fecha_inicio DATE,
    duracion TEXT,
    modalidad TEXT NOT NULL DEFAULT 'presencial',
    ubicacion TEXT,
    horarios TEXT,
    responsable_id INTEGER NOT NULL,
    contacto_email TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'abierta',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(responsable_id) REFERENCES usuarios(id_usuario)
);
```

### Tabla: `plugin_oportunidades_postulaciones`
Registra las postulaciones y su seguimiento individual.

```sql
CREATE TABLE IF NOT EXISTS plugin_oportunidades_postulaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    oportunidad_id INTEGER NOT NULL,
    alumno_id INTEGER NOT NULL,
    presentacion TEXT,
    motivacion TEXT,
    conocimientos_previos TEXT,
    disponibilidad TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    fecha_postulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas_responsable TEXT,
    FOREIGN KEY(oportunidad_id) REFERENCES plugin_oportunidades(id) ON DELETE CASCADE,
    FOREIGN KEY(alumno_id) REFERENCES usuarios(id_usuario),
    UNIQUE(oportunidad_id, alumno_id)
);
```

## 2. Índices de Optimización
- `idx_oportunidades_estado`: Acelera la búsqueda de convocatorias abiertas vs cerradas.
- `idx_oportunidades_categoria`: Filtros eficientes por categoría temática.
- `idx_oportunidades_responsable`: Carga ágil del panel docente/responsable.
- `idx_postulaciones_alumno`: Historial de postulaciones del estudiante.
- `idx_postulaciones_oportunidad`: Listado de postulantes por convocatoria.

