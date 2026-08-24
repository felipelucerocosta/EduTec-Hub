"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/guardar_mensaje.ts (CORREGIDO)
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg")); // Importa el pool de PostgreSQL
const router = (0, express_1.Router)();
router.post('/guardar-mensaje', async (req, res) => {
    const mensaje = typeof req.body.mensaje === 'string' ? req.body.mensaje : '';
    if (!mensaje || mensaje.trim() === '') {
        return res.status(400).send('Mensaje vacío');
    }
    // Sintaxis de PostgreSQL: usa $1 en lugar de ?
    const query = 'INSERT INTO tablon_mensajes (mensaje, fecha) VALUES ($1, NOW())';
    try {
        // Sintaxis de PostgreSQL: usa async/await (no callbacks)
        await conexion_pg_1.default.query(query, [mensaje]);
        res.sendStatus(200); // OK
    }
    catch (err) {
        console.error('❌ Error al guardar mensaje:', err);
        res.status(500).send('Error al guardar el mensaje');
    }
});
exports.default = router;
