"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
require("express-session");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Configuración de Multer
const storage = multer_1.default.diskStorage({
    destination: function (_req, _file, cb) {
        // Asegúrate de que esta carpeta exista o Render falle
        cb(null, 'uploads/');
    },
    filename: function (_req, file, cb) {
        cb(null, Date.now() + '-' + (file.originalname || 'file'));
    }
});
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
// ======================================================
// 1. CALENDARIO (Adaptado a SQLite)
// ======================================================
router.get('/calendario/notas', async (req, res) => {
    // Si no hay sesión, usamos un id_usuario por defecto (1) en lugar de devolver 401
    const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : 1;
    try {
        const query = `SELECT * FROM calendario_notas WHERE id_usuario = $1 ORDER BY fecha_evento ASC`;
        const result = await conexion_pg_1.default.query(query, [id_usuario]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener notas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
router.post('/calendario/notas', async (req, res) => {
    const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : 1;
    const { titulo, descripcion, fecha_evento } = req.body;
    if (!titulo || !fecha_evento) {
        return res.status(400).json({ message: 'El título y la fecha son obligatorios.' });
    }
    try {
        // SQLite: Quitamos RETURNING * para evitar errores
        const query = `
      INSERT INTO calendario_notas (id_usuario, titulo, descripcion, fecha_evento)
      VALUES ($1, $2, $3, $4)
    `;
        await conexion_pg_1.default.query(query, [id_usuario, titulo, descripcion, fecha_evento]);
        // Devolvemos lo que insertamos manualmente
        res.status(201).json({
            id_usuario, titulo, descripcion, fecha_evento, success: true
        });
    }
    catch (error) {
        console.error('Error al crear nota:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
router.delete('/calendario/notas/:id', async (req, res) => {
    const id_usuario = req.session.usuario ? Number(req.session.usuario.id) : 1;
    const { id } = req.params;
    try {
        // SQLite: Quitamos RETURNING *
        const query = `DELETE FROM calendario_notas WHERE id_nota = $1 AND id_usuario = $2`;
        await conexion_pg_1.default.query(query, [id, id_usuario]);
        res.status(200).json({ message: 'Nota eliminada' });
    }
    catch (error) {
        console.error('Error al eliminar nota:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
// ======================================================
// 2. SUBIR ACTAS (Adaptado a SQLite)
// ======================================================
router.post('/subir-acta', upload.single('acta'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se envió ningún archivo (campo "acta").' });
    }
    const { filename, originalname, path: filepath, mimetype, size } = req.file;
    try {
        // SQLite: Quitamos RETURNING id
        const insertQ = `
        INSERT INTO actas (filename, originalname, path, mimetype, size)
        VALUES ($1, $2, $3, $4, $5)
    `;
        const result = await conexion_pg_1.default.query(insertQ, [filename, originalname, filepath, mimetype, size]);
        // En el pool simulado de SQLite, result.insertId tiene el ID generado
        const insertedId = result.insertId;
        return res.status(201).json({ success: true, message: 'Acta subida e info guardada.', id: insertedId });
    }
    catch (error) {
        console.error("Error subiendo acta:", error);
        return res.status(500).json({ success: false, message: "Error interno" });
    }
});
// LISTAR ACTAS
router.get('/actas', async (_req, res) => {
    try {
        const result = await conexion_pg_1.default.query('SELECT * FROM actas ORDER BY uploaded_at DESC');
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar actas' });
    }
});
// DESCARGAR ACTAS
router.get('/actas/descargar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await conexion_pg_1.default.query('SELECT * FROM actas WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Acta no encontrada' });
        }
        const fileData = result.rows[0];
        // Ajuste de ruta para Render/Local. __dirname es backend/, '..' sube a raiz, luego entra a uploads
        const filePath = path_1.default.join(__dirname, '..', fileData.path);
        res.download(filePath, fileData.originalname, (err) => {
            if (err) {
                console.error("Error al descargar:", err);
                if (!res.headersSent) {
                    res.status(500).send("Error al descargar el archivo.");
                }
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al procesar la descarga' });
    }
});
// ======================================================
// 3. LOGOUT (Solución al error TS2339 y tipos any)
// ======================================================
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({ message: 'No se pudo cerrar la sesión' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    });
});
exports.default = router;
