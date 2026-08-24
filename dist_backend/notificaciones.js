"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const router = (0, express_1.Router)();
const getUserId = (req) => req.session?.usuario?.id;
// GET /api/notificaciones - Get notifications for logged in user
router.get('/notificaciones', async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    try {
        const query = `
      SELECT * FROM notificaciones 
      WHERE usuario_id = $1 
      ORDER BY fecha DESC 
      LIMIT 50
    `;
        const result = await conexion_pg_1.default.query(query, [userId]);
        return res.json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener notificaciones:', error);
        return res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
});
// PUT /api/notificaciones/:id/leer - Mark single notification as read
router.put('/notificaciones/:id/leer', async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    try {
        await conexion_pg_1.default.query('UPDATE notificaciones SET leida = 1 WHERE id = $1 AND usuario_id = $2', [id, userId]);
        return res.json({ success: true, message: 'Notificación marcada como leída' });
    }
    catch (error) {
        console.error('Error al marcar notificación:', error);
        return res.status(500).json({ error: 'Error interno' });
    }
});
// PUT /api/notificaciones/leer-todas - Mark all notifications as read
router.put('/notificaciones/leer-todas', async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    try {
        await conexion_pg_1.default.query('UPDATE notificaciones SET leida = 1 WHERE usuario_id = $1', [userId]);
        return res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    }
    catch (error) {
        console.error('Error al marcar todas las notificaciones:', error);
        return res.status(500).json({ error: 'Error interno' });
    }
});
exports.default = router;
