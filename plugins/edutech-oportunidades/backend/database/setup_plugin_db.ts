/**
 * ============================================================================
 * ARCHIVO: setup_plugin_db.ts
 * PLUGIN: EduTech Oportunidades — Portal de Pasantías y Proyectos
 * ROL ARQUITECTURAL: Migraciones e Inicialización de Base de Datos (Database Schema)
 * ============================================================================
 * 
 * RESPONSABILIDAD:
 * Crea las tablas e índices necesarios para el plugin de Oportunidades si no
 * existen previamente en el motor PostgreSQL.
 * 
 * POLÍTICA DE SEGURIDAD Y AISLAMIENTO:
 * - Todas las tablas llevan el prefijo `plugin_oportunidades*` para evitar colisiones
 *   con el esquema central de EduTec-Hub.
 * - Se definen claves foráneas (FOREIGN KEY) hacia `usuarios(id_usuario)` con borrado
 *   en cascada (ON DELETE CASCADE) cuando corresponde, asegurando integridad referencial.
 */

import pool from '../../../../backend/conexion_pg';

export async function setupOportunidadesDatabase(): Promise<void> {
  try {
    /**
     * ------------------------------------------------------------------------
     * TABLA 1: plugin_oportunidades (Convocatorias Institucionales)
     * ------------------------------------------------------------------------
     * Almacena cada una de las ofertas de pasantías, becas o proyectos técnicos.
     * 
     * Columnas destacadas:
     * - id: Clave primaria autoincremental.
     * - titulo, institucion, descripcion: Información descriptiva básica.
     * - tipo_oportunidad: 'pasantia' | 'proyecto_tecnico' | 'investigacion' | 'beca'.
     * - vacantes_totales: Cupo máximo de alumnos admitidos.
     * - vacantes_ocupadas: Contador dinámico de aspirantes aceptados.
     * - fecha_cierre_inscripcion: Fecha límite tras la cual se cierra la inscripción.
     * - modalidad: 'presencial' | 'remoto' | 'hibrido'.
     * - responsable_id: Usuario docente/directivo que creó y gestiona la búsqueda.
     * - estado: 'abierta' | 'cerrada' | 'finalizada'.
     */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plugin_oportunidades (
          id SERIAL PRIMARY KEY,
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

    /**
     * ------------------------------------------------------------------------
     * TABLA 2: plugin_oportunidades_postulaciones (Postulaciones de Alumnos)
     * ------------------------------------------------------------------------
     * Almacena las solicitudes enviadas por los estudiantes a una oportunidad.
     * 
     * Restricción UNIQUE(oportunidad_id, alumno_id):
     * Impide que un alumno se postule dos veces a la misma convocatoria.
     * 
     * Clave foránea ON DELETE CASCADE:
     * Si la oportunidad es eliminada, sus postulaciones se eliminan automáticamente.
     */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plugin_oportunidades_postulaciones (
          id SERIAL PRIMARY KEY,
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

    /**
     * ------------------------------------------------------------------------
     * ÍNDICES DE ACELERACIÓN B-TREE
     * ------------------------------------------------------------------------
     * Agilizan drásticamente los filtros frecuentes del catálogo público
     * y las consultas por responsable y por alumno.
     */
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
