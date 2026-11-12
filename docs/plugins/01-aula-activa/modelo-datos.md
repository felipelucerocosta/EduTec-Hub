# Modelo de Datos — EduTech Aula Activa

## 1. Entidades Principales

### Tabla: `trabajos` (Core EduTech)
Representa las consignas publicadas en cada comisión.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `clase_id`: INTEGER NOT NULL (FK -> `clases.id`)
- `titulo`: TEXT NOT NULL
- `descripcion`: TEXT
- `instrucciones`: TEXT
- `fecha_limite`: DATE / TIMESTAMP
- `puntos_max`: INTEGER DEFAULT 10
- `tipo_entrega`: TEXT DEFAULT 'individual'
- `creado_por`: INTEGER NOT NULL (FK -> `usuarios.id_usuario`)
- `fecha_creacion`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Tabla: `entregas` (Core EduTech)
Registra las resoluciones y estados de entrega de cada alumno.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `trabajo_id`: INTEGER NOT NULL (FK -> `trabajos.id`)
- `alumno_id`: INTEGER NOT NULL (FK -> `usuarios.id_usuario`)
- `archivo_nombre`: TEXT
- `archivo_path`: TEXT
- `comentario`: TEXT
- `calificacion`: NUMERIC(4,2) (Valores entre 1.00 y 10.00)
- `feedback`: TEXT (Devolución pedagógica del docente)
- `estado`: TEXT ('entregado', 'entrega_tardia', 'corregido', 'reentrega')
- `fecha_entrega`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `fecha_calificacion`: TIMESTAMP

### Tabla: `plugin_aula_activa_consultas` (Plugin Schema)
Almacena las consultas pedagógicas en tiempo real de cada comisión.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `clase_id`: INTEGER NOT NULL (FK -> `clases.id` ON DELETE CASCADE)
- `trabajo_id`: INTEGER (FK -> `trabajos.id` ON DELETE CASCADE, opcional)
- `usuario_id`: INTEGER NOT NULL (FK -> `usuarios.id_usuario`)
- `mensaje`: TEXT NOT NULL
- `fecha`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## 2. Índices de Rendimiento
- `idx_aula_activa_clase`: Índice sobre `clase_id` en `plugin_aula_activa_consultas`.
- `idx_aula_activa_trabajo`: Índice sobre `trabajo_id` en `plugin_aula_activa_consultas`.

