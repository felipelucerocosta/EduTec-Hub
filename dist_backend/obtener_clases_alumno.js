"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const router = (0, express_1.Router)();
router.get('/alumno/mis-clases', async (req, res) => {
    const alumno_id = req.session.usuario?.id;
    if (!alumno_id) {
        return res.status(401).json({ error: 'No has iniciado sesión.' });
    }
    try {
        // Esta consulta une la tabla 'alumnos_clases' con 'clases'
        // para obtener el nombre real de la clase y del profesor (creador)
        const query = `
      SELECT DISTINCT
        c.id,
        c.nombre, 
        c.materia, 
        c.seccion, 
        c.aula, 
        c.creador, 
        c.codigo
      FROM clases c
      LEFT JOIN alumnos_clases ac ON c.codigo = ac.codigo
      WHERE ac.alumno_id = $1 OR c.seccion = 'Secundario'
      ORDER BY c.id DESC
    `;
        const result = await conexion_pg_1.default.query(query, [alumno_id]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener clases del alumno:', error);
        res.status(500).json({ error: 'Error interno al obtener las clases.' });
    }
});
exports.default = router;
