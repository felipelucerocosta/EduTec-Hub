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
          id INTEGER PRIMARY KEY AUTOINCREMENT,
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
          id INTEGER PRIMARY KEY AUTOINCREMENT,
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
          id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    // 4. Índices de aceleración
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

    console.log('✅ [Plugin EduTech Preceptoría] Esquema de base de datos verificado con éxito.');
  } catch (error) {
    console.error('❌ [Plugin EduTech Preceptoría] Error al inicializar base de datos:', error);
    throw error;
  }
}

export default setupPreceptoriaDatabase;

