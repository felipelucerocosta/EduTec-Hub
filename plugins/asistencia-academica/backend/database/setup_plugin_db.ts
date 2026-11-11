import pool from '../../../../backend/conexion_pg';

/**
 * Inicializador idempotente del esquema de base de datos del plugin.
 * Se ejecuta al iniciar el servidor a través del Plugin Registry.
 */
export async function setupAsistenciaDatabase(): Promise<void> {
  try {
    // 1. Tabla de Sesiones
    await pool.query(`
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
    `);

    // 2. Tabla de Registros
    await pool.query(`
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
    `);

    // 3. Índices de rendimiento
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_asistencias_sesion_fecha 
      ON plugin_asistencias_sesiones(clase_id, fecha);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_asistencias_reg_alumno 
      ON plugin_asistencias_registros(alumno_id, estado);
    `);

    console.log('✅ [Plugin Asistencias] Esquema de base de datos verificado/creado con éxito.');
  } catch (error) {
    console.error('❌ [Plugin Asistencias] Error al inicializar base de datos:', error);
    throw error;
  }
}

export default setupAsistenciaDatabase;

