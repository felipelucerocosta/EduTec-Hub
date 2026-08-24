"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
// Ruta a la base de datos dentro de la carpeta 'database' en la raíz del proyecto
const dbPath = path_1.default.resolve(__dirname, '../database/edutechhub.sql');
let db = null;
// Función para iniciar la conexión
async function getDb() {
    if (!db) {
        db = await (0, sqlite_1.open)({
            filename: dbPath,
            driver: sqlite3_1.default.Database
        });
        // Habilitar soporte de claves foráneas en SQLite
        await db.run('PRAGMA foreign_keys = ON;');
        await db.run('PRAGMA journal_mode = WAL;');
    }
    return db;
}
// Simulamos el pool de pg para que los controladores del backend sigan funcionando
const pool = {
    query: async (text, params = []) => {
        const database = await getDb();
        // Convertir parámetros de estilo Postgres ($1, $2) a estilo SQLite (?)
        const sqlNormalizado = text.replace(/\$\d+/g, '?');
        // Eliminar cláusula RETURNING (no compatible con SQLite < 3.35)
        const sqlSinReturning = sqlNormalizado.replace(/\s+RETURNING\s+\S+/gi, '');
        try {
            const upperText = text.trim().toUpperCase();
            const isSelect = upperText.startsWith('SELECT');
            const hasReturning = upperText.includes('RETURNING');
            if (isSelect) {
                // SELECT normal
                const rows = await database.all(sqlNormalizado, params);
                return { rows, rowCount: rows.length, insertId: null };
            }
            else if (hasReturning) {
                // INSERT/UPDATE con RETURNING → ejecutar sin RETURNING y luego SELECT last_insert_rowid()
                const result = await database.run(sqlSinReturning, params);
                const lastId = result.lastID;
                // Determinar qué tabla y qué columna primary key usar para recuperar la fila
                const tableMatch = text.match(/INTO\s+(\w+)/i);
                const tableName = tableMatch ? tableMatch[1].toLowerCase() : null;
                let returnedRow = {};
                if (tableName && lastId) {
                    // Mapeo de tablas a sus PKs
                    const pkMap = {
                        usuarios: 'id_usuario',
                        alumno: 'id_alumno',
                        profesor: 'id_profesor',
                        clases: 'id',
                        password_resets: 'id',
                        email_verifications: 'id',
                    };
                    const pk = pkMap[tableName] || 'id';
                    try {
                        const fetchedRows = await database.all(`SELECT * FROM ${tableName} WHERE ${pk} = ?`, [lastId]);
                        returnedRow = fetchedRows[0] || {};
                    }
                    catch {
                        returnedRow = { [pkMap[tableName] || 'id']: lastId };
                    }
                }
                else if (lastId) {
                    returnedRow = { id: lastId, id_usuario: lastId };
                }
                return {
                    rows: [returnedRow],
                    rowCount: result.changes ?? 0,
                    insertId: lastId
                };
            }
            else {
                // INSERT/UPDATE/DELETE sin RETURNING
                const result = await database.run(sqlNormalizado, params);
                return {
                    rows: [],
                    rowCount: result.changes ?? 0,
                    insertId: result.lastID
                };
            }
        }
        catch (error) {
            console.error('Error SQL (SQLite):', error);
            console.error('Query:', text);
            console.error('Params:', params);
            throw error;
        }
    }
};
exports.default = pool;
