"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const router = (0, express_1.Router)();
// POST /api/guardar-mensaje - Post message to forum (supports class-specific or global)
router.post('/guardar-mensaje', async (req, res) => {
    const { mensaje, clase_id } = req.body;
    if (!mensaje || mensaje.trim() === '') {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }
    const userId = req.session?.usuario?.id || null;
    const userNombre = req.session?.usuario?.nombre || 'Usuario';
    try {
        if (clase_id) {
            // Save as class announcement
            await conexion_pg_1.default.query('INSERT INTO anuncios (clase_id, autor_id, contenido) VALUES ($1, $2, $3)', [clase_id, userId || 1, mensaje.trim()]);
        }
        else {
            // Save to global forum
            const formatted = userId ? `[${userNombre}] ${mensaje.trim()}` : mensaje.trim();
            await conexion_pg_1.default.query('INSERT INTO tablon_mensajes (mensaje) VALUES ($1)', [formatted]);
        }
        return res.status(201).json({ success: true, message: 'Mensaje publicado' });
    }
    catch (err) {
        console.error('❌ Error al guardar mensaje:', err);
        return res.status(500).json({ error: 'Error al guardar el mensaje' });
    }
});
// GET /api/mensajes - List forum messages as JSON
router.get('/mensajes', async (req, res) => {
    const clase_id = req.query.clase_id;
    try {
        if (clase_id) {
            const query = `
        SELECT a.id, a.contenido as mensaje, a.fecha, u.nombre_completo as autor_nombre, u.rol as autor_rol
        FROM anuncios a
        LEFT JOIN usuarios u ON a.autor_id = u.id_usuario
        WHERE a.clase_id = $1
        ORDER BY a.fecha DESC
        LIMIT 50
      `;
            const result = await conexion_pg_1.default.query(query, [clase_id]);
            return res.json(result.rows);
        }
        else {
            const result = await conexion_pg_1.default.query(`
        SELECT id, mensaje, fecha 
        FROM tablon_mensajes 
        ORDER BY id DESC 
        LIMIT 50
      `);
            return res.json(result.rows || []);
        }
    }
    catch (err) {
        console.error('❌ Error al obtener mensajes:', err);
        return res.status(500).json({ error: 'Error en el servidor al obtener mensajes' });
    }
});
exports.default = router;
