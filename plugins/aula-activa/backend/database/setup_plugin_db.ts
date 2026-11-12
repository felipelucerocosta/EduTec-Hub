import pool from '../../../../backend/conexion_pg';

/**
 * Inicializador idempotente del esquema de base de datos del plugin Aula Activa.
 */
export async function setupAulaActivaDatabase(): Promise<void> {
  try {
    // 1. Tabla de consultas y mensajes pedagógicos de Aula Activa
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plugin_aula_activa_consultas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clase_id INTEGER NOT NULL,
          trabajo_id INTEGER,
          usuario_id INTEGER NOT NULL,
          mensaje TEXT NOT NULL,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
          FOREIGN KEY(trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE,
          FOREIGN KEY(usuario_id) REFERENCES usuarios(id_usuario)
      );
    `);

    // 2. Índices de optimización
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_aula_activa_clase
      ON plugin_aula_activa_consultas(clase_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_aula_activa_trabajo
      ON plugin_aula_activa_consultas(trabajo_id);
    `);

    console.log('✅ [Plugin Aula Activa] Esquema de base de datos verificado con éxito.');
  } catch (error) {
    console.error('❌ [Plugin Aula Activa] Error al inicializar base de datos:', error);
    throw error;
  }
}

export default setupAulaActivaDatabase;

