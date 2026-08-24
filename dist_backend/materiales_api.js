"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'mat-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
const getUserId = (req) => req.session?.usuario?.id;
// GET /api/materiales/:claseId - List materials for a class
router.get('/materiales/:claseId', async (req, res) => {
    const { claseId } = req.params;
    try {
        const query = `
      SELECT m.*, u.nombre_completo as creador_nombre
      FROM materiales m
      LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
      WHERE m.clase_id = $1
      ORDER BY m.fecha_creacion DESC
    `;
        const result = await conexion_pg_1.default.query(query, [claseId]);
        return res.json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener materiales:', error);
        return res.status(500).json({ error: 'Error al obtener materiales' });
    }
});
// POST /api/materiales - Upload/create material for a class
router.post('/materiales', upload.single('archivo'), async (req, res) => {
    const { clase_id, titulo, descripcion, tipo, enlace } = req.body;
    const userId = getUserId(req);
    const userRol = req.session?.usuario?.rol;
    if (!userId || (userRol !== 'profesor' && userRol !== 'admin')) {
        return res.status(403).json({ error: 'Solo los profesores pueden publicar materiales.' });
    }
    if (!clase_id || !titulo) {
        return res.status(400).json({ error: 'El ID de clase y el título son obligatorios.' });
    }
    const archivoNombre = req.file ? req.file.originalname : null;
    const archivoPath = req.file ? req.file.filename : null;
    try {
        const query = `
      INSERT INTO materiales (clase_id, titulo, descripcion, tipo, archivo_nombre, archivo_path, enlace, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
        await conexion_pg_1.default.query(query, [
            clase_id,
            titulo.trim(),
            descripcion ? descripcion.trim() : null,
            tipo || 'documento',
            archivoNombre,
            archivoPath,
            enlace || null,
            userId
        ]);
        return res.status(201).json({ success: true, message: 'Material publicado correctamente' });
    }
    catch (error) {
        console.error('Error al crear material:', error);
        return res.status(500).json({ error: 'Error al publicar material' });
    }
});
// DELETE /api/materiales/:id - Delete material
router.delete('/materiales/:id', async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    const userRol = req.session?.usuario?.rol;
    if (!userId || (userRol !== 'profesor' && userRol !== 'admin')) {
        return res.status(403).json({ error: 'No tienes permisos para eliminar este material.' });
    }
    try {
        await conexion_pg_1.default.query('DELETE FROM materiales WHERE id = $1', [id]);
        return res.json({ success: true, message: 'Material eliminado' });
    }
    catch (error) {
        console.error('Error al eliminar material:', error);
        return res.status(500).json({ error: 'Error al eliminar material' });
    }
});
// GET /api/materiales/descargar/:filename - Download material
router.get('/materiales/descargar/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path_1.default.join(uploadsDir, filename);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    return res.download(filePath);
});
exports.default = router;
