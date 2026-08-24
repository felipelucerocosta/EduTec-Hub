"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg")); // 👈 1. Importa el POOL de PostgreSQL
const router = (0, express_1.Router)();
// Ruta GET para obtener clases (CORREGIDA PARA POSTGRESQL)
router.get('/clases', async (_req, res) => {
    // 👈 3. Consulta SQL corregida para incluir el ID
    const sql = 'SELECT id, nombre, seccion, materia, aula, creador, codigo FROM clases ORDER BY id DESC';
    try {
        // 👈 4. Usa pool.query con await (sin callbacks)
        const result = await conexion_pg_1.default.query(sql);
        // pg's QueryResult expone las filas en un array 'rows'
        const rows = result && result.rows ? result.rows : [];
        res.json(rows);
    }
    catch (err) { // 👈 5. Captura de errores
        console.error('❌ Error al consultar clases:', err);
        return res.json([]); // Devolver un array vacío en caso de error
    }
});
exports.default = router;
