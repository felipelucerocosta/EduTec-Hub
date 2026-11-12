import pool from '../../../../backend/conexion_pg';

/**
 * Esquema de base de datos para el plugin EduTech Oportunidades
 * Compatible con SQLite / PostgreSQL adapter.
 */
export async function setupOportunidadesDatabase(): Promise<void> {
  try {
    // 1. Tabla de Oportunidades Institucionales
    await pool.query(`
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
    `);

    // 2. Tabla de Postulaciones de Alumnos
    await pool.query(`
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
    `);

    // 3. Índices de aceleración
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_oportunidades_estado
      ON plugin_oportunidades(estado);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_oportunidades_categoria
      ON plugin_oportunidades(categoria);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_oportunidades_responsable
      ON plugin_oportunidades(responsable_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_postulaciones_alumno
      ON plugin_oportunidades_postulaciones(alumno_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_postulaciones_oportunidad
      ON plugin_oportunidades_postulaciones(oportunidad_id);
    `);

    console.log('✅ [Plugin Oportunidades] Esquema de base de datos verificado con éxito.');
  } catch (error) {
    console.error('❌ [Plugin Oportunidades] Error al inicializar base de datos:', error);
    throw error;
  }
}

export default setupOportunidadesDatabase;

