"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const router = (0, express_1.Router)();
router.get('/profesor/mis-clases', async (req, res) => {
    const usuario = req.session?.usuario;
    if (!usuario) {
        return res.status(401).json({ error: 'No autorizado.' });
    }
    const user_id = usuario.id || 0;
    const es_admin = usuario.rol === 'admin';
    try {
        let query;
        let params;
        if (es_admin) {
            // Admin ve todas las clases
            query = `
        SELECT 
          c.id, 
          c.nombre, 
          c.seccion, 
          c.materia, 
          c.aula, 
          c.creador, 
          c.codigo,
          c.titular_id,
          (SELECT COUNT(*) FROM alumnos_clases ac WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos
        FROM clases c 
        ORDER BY c.id DESC
      `;
            params = [];
        }
        else {
            // Profesor solo ve clases donde es titular o creador
            query = `
        SELECT 
          c.id, 
          c.nombre, 
          c.seccion, 
          c.materia, 
          c.aula, 
          c.creador, 
          c.codigo,
          c.titular_id,
          (SELECT COUNT(*) FROM alumnos_clases ac WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos
        FROM clases c 
        WHERE c.titular_id = $1 OR c.creador_id = $1 OR c.titular_id IS NULL OR c.creador_id IS NULL
        ORDER BY c.id DESC
      `;
            params = [user_id];
        }
        const result = await conexion_pg_1.default.query(query, params);
        return res.json(result.rows || []);
    }
    catch (error) {
        console.error('Error al obtener clases del profesor:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});
exports.default = router;
