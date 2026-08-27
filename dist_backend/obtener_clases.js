"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const router = (0, express_1.Router)();
// GET /api/clases - Obtener lista de clases con la cantidad real de alumnos inscriptos
router.get('/clases', async (_req, res) => {
    const sql = `
    SELECT 
      c.id, 
      c.nombre, 
      c.seccion, 
      c.materia, 
      c.aula, 
      c.creador, 
      c.codigo,
      (SELECT COUNT(*) FROM alumnos_clases ac WHERE ac.codigo = c.codigo) AS cantidad_alumnos
    FROM clases c
    ORDER BY c.id DESC
  `;
    try {
        const result = await conexion_pg_1.default.query(sql);
        const rows = result && result.rows ? result.rows : [];
        res.json(rows);
    }
    catch (err) {
        console.error('❌ Error al consultar clases:', err);
        return res.json([]);
    }
});
exports.default = router;
