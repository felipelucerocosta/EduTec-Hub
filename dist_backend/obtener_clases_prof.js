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
    const nombre_profesor = usuario?.nombre || '';
    const user_id = usuario?.id || 0;
    try {
        // Buscamos las clases donde el creador sea este profesor (por ID o por nombre) o sean del secundario por defecto
        const query = `
      SELECT * FROM clases 
      WHERE creador_id = $1 
         OR (creador = $2 AND creador IS NOT NULL AND creador != '') 
         OR seccion = 'Secundario' 
      ORDER BY id DESC
    `;
        const result = await conexion_pg_1.default.query(query, [user_id, nombre_profesor]);
        return res.json(result.rows || []);
    }
    catch (error) {
        console.error('Error al obtener clases del profesor:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});
exports.default = router;
