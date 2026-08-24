"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const router = (0, express_1.Router)();
router.get('/mensajes-legacy', async (_req, res) => {
    const sql = `
    SELECT mensaje, fecha 
    FROM tablon_mensajes 
    ORDER BY id DESC 
    LIMIT 30
  `;
    try {
        const result = await conexion_pg_1.default.query(sql);
        const results = result && Array.isArray(result.rows) ? result.rows : [];
        let html = '';
        results.forEach(row => {
            const fecha = new Date(row.fecha);
            const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()} ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
            const mensaje = escapeHtml(row.mensaje);
            html += `<div style='margin-bottom:10px;'><b>${fechaFormateada}:</b> ${mensaje}</div>`;
        });
        res.send(html);
    }
    catch (err) {
        console.error("❌ Error al obtener mensajes:", err);
        res.status(500).send("Error en el servidor.");
    }
});
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
exports.default = router;
