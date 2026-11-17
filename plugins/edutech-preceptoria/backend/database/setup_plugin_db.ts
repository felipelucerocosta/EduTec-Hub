import pool from '../../../../backend/conexion_pg';

/**
 * Esquema de Base de Datos para el plugin EduTech Preceptoría
 * Responsabilidad Única: Asistencia y Asignaciones de Preceptores
 */
export async function setupPreceptoriaDatabase(): Promise<void> {
  try {
    // 1. Tabla de asignaciones de preceptores a clases
    await pool.query(`
      CREATE TABLE IF NOT EXISTS preceptores_clases (
          id SERIAL PRIMARY KEY,
          preceptor_id INTEGER NOT NULL,
          clase_id INTEGER NOT NULL,
          fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(preceptor_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
          FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
          UNIQUE(preceptor_id, clase_id)
      );
    `);

    // 2. Tabla de sesiones de asistencia
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plugin_preceptoria_sesiones (
          id SERIAL PRIMARY KEY,
          clase_id INTEGER NOT NULL,
          fecha TEXT NOT NULL,
          preceptor_id INTEGER NOT NULL,
          observaciones TEXT,
          fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
          FOREIGN KEY(preceptor_id) REFERENCES usuarios(id_usuario),
          UNIQUE(clase_id, fecha)
      );
    `);

    // 3. Tabla de registros individuales de asistencia por alumno
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plugin_preceptoria_registros (
          id SERIAL PRIMARY KEY,
          sesion_id INTEGER NOT NULL,
          alumno_id INTEGER NOT NULL,
          estado TEXT NOT NULL CHECK(estado IN ('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO')),
          observacion TEXT,
          modificado_por INTEGER,
          fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(sesion_id) REFERENCES plugin_preceptoria_sesiones(id) ON DELETE CASCADE,
          FOREIGN KEY(alumno_id) REFERENCES usuarios(id_usuario),
          FOREIGN KEY(modificado_por) REFERENCES usuarios(id_usuario),
          UNIQUE(sesion_id, alumno_id)
      );
    `);

    // 4. Tabla de solicitudes y emisión de constancias de alumno regular
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plugin_preceptoria_constancias (
          id SERIAL PRIMARY KEY,
          alumno_id INTEGER NOT NULL,
          preceptor_id INTEGER,
          clase_id INTEGER,
          motivo TEXT,
          estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
          fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_resolucion TIMESTAMP,
          observaciones TEXT,
          codigo_verificacion TEXT UNIQUE,
          FOREIGN KEY(alumno_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
          FOREIGN KEY(preceptor_id) REFERENCES usuarios(id_usuario),
          FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE SET NULL
      );
    `);

    // 5. Índices de aceleración
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_preceptoria_sesion_clase_fecha
      ON plugin_preceptoria_sesiones(clase_id, fecha);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_preceptores_clase_lookup
      ON preceptores_clases(preceptor_id, clase_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_preceptoria_registros_alumno
      ON plugin_preceptoria_registros(alumno_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_preceptoria_constancias_alumno
      ON plugin_preceptoria_constancias(alumno_id, estado);
    `);

    // 6. Tabla de Asistencias del Personal Docente (Gestión Laboral Institucional)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plugin_asistencias_docentes (
          id SERIAL PRIMARY KEY,
          profesor_id INTEGER NOT NULL,
          fecha TEXT NOT NULL,
          estado TEXT NOT NULL CHECK(estado IN ('PRESENTE', 'AUSENTE_JUSTIFICADO', 'AUSENTE_INJUSTIFICADO', 'TARDE')),
          motivo TEXT,
          observaciones TEXT,
          modificado_por INTEGER,
          fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(profesor_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
          FOREIGN KEY(modificado_por) REFERENCES usuarios(id_usuario),
          UNIQUE(profesor_id, fecha)
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_asistencias_docentes_prof_fecha
      ON plugin_asistencias_docentes(profesor_id, fecha);
    `);

    console.log('✅ [Plugin EduTech Preceptoría] Esquema de base de datos verificado con éxito.');
  } catch (error) {
    console.error('❌ [Plugin EduTech Preceptoría] Error al inicializar base de datos:', error);
    throw error;
  }
}

export default setupPreceptoriaDatabase;

