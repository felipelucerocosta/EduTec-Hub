-- ========================================================
-- PLUGIN: Asistencia Académica y Control de Regularidad
-- DDL de Tablas Aisladas (Compatible con SQLite y PostgreSQL)
-- ========================================================

-- 1. Tabla de Sesiones de Asistencia (Cabecera de la jornada)
CREATE TABLE IF NOT EXISTS plugin_asistencias_sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clase_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    creado_por INTEGER NOT NULL,
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
    FOREIGN KEY(creado_por) REFERENCES usuarios(id_usuario),
    UNIQUE(clase_id, fecha)
);

-- 2. Tabla de Registros Individuales de Asistencia por Estudiante
CREATE TABLE IF NOT EXISTS plugin_asistencias_registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sesion_id INTEGER NOT NULL,
    alumno_id INTEGER NOT NULL,
    estado TEXT NOT NULL CHECK(estado IN ('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO')),
    observacion TEXT,
    FOREIGN KEY(sesion_id) REFERENCES plugin_asistencias_sesiones(id) ON DELETE CASCADE,
    FOREIGN KEY(alumno_id) REFERENCES usuarios(id_usuario),
    UNIQUE(sesion_id, alumno_id)
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_asistencias_sesion_fecha ON plugin_asistencias_sesiones(clase_id, fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_reg_alumno ON plugin_asistencias_registros(alumno_id, estado);

