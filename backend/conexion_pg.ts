import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde backend/.env o desde el .env raíz
const envCandidates = [
  path.resolve(__dirname, '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

// Configuración de conexión PostgreSQL
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'epipe',
  database: process.env.PG_DATABASE || 'edutechub',
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Instancia nativa del Pool de PostgreSQL
export const nativePool = new Pool(poolConfig);

nativePool.on('connect', () => {
  // Conexión activa al pool
});

nativePool.on('error', (err) => {
  console.error('❌ [PostgreSQL Pool Error]:', err);
});

console.log(`🐘 [PostgreSQL] Pool inicializado hacia base de datos "${poolConfig.database}" en ${poolConfig.host}:${poolConfig.port}`);

/**
 * Normalizador de consultas para garantizar compatibilidad total entre código
 * legado y PostgreSQL nativo.
 */
function normalizeQuery(text: string): { sql: string; skip: boolean } {
  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  // Omitir o responder vacío a comandos específicos de SQLite (ej. PRAGMAs)
  if (upper.startsWith('PRAGMA ')) {
    return { sql: trimmed, skip: true };
  }

  let sql = trimmed;

  // Reemplazar sintaxis SQLite específica si ocurriera
  if (sql.includes('INTEGER PRIMARY KEY AUTOINCREMENT')) {
    sql = sql.replace(/\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/gi, 'SERIAL PRIMARY KEY');
  }

  if (sql.includes('INSERT OR IGNORE INTO')) {
    sql = sql.replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, 'INSERT INTO') + ' ON CONFLICT DO NOTHING';
  }

  return { sql, skip: false };
}

export interface EduTechQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  insertId?: any;
  command?: string;
}

/**
 * Exportación unificada de pool compatible con la API de pg y con los controladores de EduTech.
 */
const pool = {
  nativePool,

  /**
   * Ejecuta una consulta SQL en PostgreSQL retornando filas y metadatos estándar.
   */
  query: async <T extends QueryResultRow = any>(
    text: string,
    params: any[] = []
  ): Promise<EduTechQueryResult<T>> => {
    const { sql, skip } = normalizeQuery(text);

    if (skip) {
      return { rows: [], rowCount: 0, insertId: null, command: 'PRAGMA_SKIP' };
    }

    try {
      const result: QueryResult<T> = await nativePool.query(sql, params);

      // Si la consulta retornó filas (ej. RETURNING id o RETURNING id_usuario), capturar el ID primario
      let insertId: any = null;
      if (result.rows && result.rows.length > 0) {
        const firstRow = result.rows[0] as any;
        insertId =
          firstRow.id ??
          firstRow.id_usuario ??
          firstRow.id_alumno ??
          firstRow.id_profesor ??
          firstRow.id_curso ??
          firstRow.id_nota ??
          null;
      }

      return {
        rows: result.rows,
        rowCount: result.rowCount ?? result.rows.length,
        insertId,
        command: result.command,
      };
    } catch (error) {
      console.error('❌ [PostgreSQL Error en Query]:', error);
      console.error('SQL ejecutado:', sql);
      console.error('Parámetros:', params);
      throw error;
    }
  },

  /**
   * Obtiene un cliente dedicado del pool para transacciones complejas.
   */
  connect: () => nativePool.connect(),

  /**
   * Cierra todas las conexiones del pool.
   */
  end: () => nativePool.end(),

  /**
   * Registro de eventos del pool.
   */
  on: nativePool.on.bind(nativePool),
};

export default pool;
