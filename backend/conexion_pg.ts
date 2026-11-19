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

// Configuración de conexión exclusiva a PostgreSQL
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
  // Conexión activa al pool de PostgreSQL
});

nativePool.on('error', (err) => {
  console.error('❌ [PostgreSQL Pool Error]:', err);
});

console.log(`🐘 [PostgreSQL] Pool inicializado hacia base de datos "${poolConfig.database}" en ${poolConfig.host}:${poolConfig.port}`);

/**
 * Normalizador de consultas para garantizar que los parámetros posicionales
 * sean siempre compatibles con PostgreSQL ($1, $2, $3...).
 */
function normalizeQuery(text: string): { sql: string; skip: boolean } {
  let sql = text.trim();

  // Convertir comodines posicionales '?' a '$1, $2, $3...' si existieran
  if (sql.includes('?')) {
    let paramIndex = 1;
    sql = sql.replace(/\?/g, () => `$${paramIndex++}`);
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
 * Exportación unificada de pool nativo PostgreSQL para todos los módulos de EduTech.
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
      return { rows: [], rowCount: 0, insertId: null, command: 'SKIP' };
    }

    try {
      const rawResult: any = await nativePool.query(sql, params);
      // Cuando se ejecutan múltiples sentencias en una sola llamada, node-postgres retorna un Array de resultados
      const result: QueryResult<T> = Array.isArray(rawResult) ? rawResult[rawResult.length - 1] : rawResult;
      const rows = result?.rows || [];

      // Si la consulta retornó filas (ej. RETURNING id o RETURNING id_usuario), capturar el ID primario
      let insertId: any = null;
      if (rows && rows.length > 0) {
        const firstRow = rows[0] as any;
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
        rows,
        rowCount: result?.rowCount ?? rows.length,
        insertId,
        command: result?.command || '',
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
