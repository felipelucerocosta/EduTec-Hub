import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Nombre del archivo de la base de datos
const dbPath = path.resolve(__dirname, 'database.sqlite');

let db: Database | null = null;

// Función para iniciar la conexión
async function getDb() {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  }
  return db;
}

// Simulamos el "pool" de PostgreSQL para que no tengas que cambiar tanto código
const pool = {
  query: async (text: string, params: any[] = []) => {
    const database = await getDb();
    
    // SQLite usa '?' en lugar de '$1', '$2'. 
    // Intentamos reemplazar automáticamente los $1, $2 por ? (es un parche básico)
    const sqlNormalizado = text.replace(/\$\d+/g, '?');

    try {
      // Si es un SELECT, usamos .all()
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await database.all(sqlNormalizado, params);
        return { rows: rows, rowCount: rows.length };
      } 
      // Si es INSERT, UPDATE, DELETE, usamos .run()
      else {
        const result = await database.run(sqlNormalizado, params);
        // SQLite no devuelve las filas insertadas automáticamente como Postgres (RETURNING *)
        // Devolvemos algo básico para que no rompa
        return { 
            rows: [], 
            rowCount: result.changes, 
            insertId: result.lastID 
        };
      }
    } catch (error) {
      console.error("Error SQL (SQLite):", error);
      throw error;
    }
  }
};

export default pool;
