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
const permisos_1 = require("./permisos");
const router = (0, express_1.Router)();
// Configure multer storage for submissions
const uploadsDir = process.env.UPLOADS_PATH || path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'entrega-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});
const getUserId = (req) => req.session?.usuario?.id;
// POST /api/trabajos/:trabajoId/entregar - Submit assignment (Student enrolled in class)
router.post('/trabajos/:trabajoId/entregar', upload.single('archivo'), async (req, res) => {
    const { trabajoId } = req.params;
    const { comentario } = req.body;
    const usuario = req.session?.usuario;
    if (!usuario || !usuario.id) {
        return res.status(401).json({ error: 'Debes iniciar sesión para entregar.' });
    }
    try {
        // Check if work exists
        const trabajoQ = await conexion_pg_1.default.query('SELECT * FROM trabajos WHERE id = $1', [trabajoId]);
        if (trabajoQ.rows.length === 0) {
            return res.status(404).json({ error: 'Trabajo no encontrado.' });
        }
        const trabajo = trabajoQ.rows[0];
        // Verificar que el alumno pertenezca a la clase del trabajo
        const { permitido, motivo } = await (0, permisos_1.verificarAccesoClase)(usuario, trabajo.clase_id);
        if (!permitido) {
            return res.status(403).json({ error: motivo || 'No tienes permisos para entregar trabajos en esta clase.' });
        }
        const now = new Date();
        const esTardia = trabajo.fecha_limite && new Date(trabajo.fecha_limite) < now;
        const estado = esTardia ? 'entrega_tardia' : 'entregado';
        const archivoNombre = req.file ? req.file.originalname : null;
        const archivoPath = req.file ? req.file.filename : null;
        // Check if already submitted
        const existingQ = await conexion_pg_1.default.query('SELECT id FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2', [trabajoId, usuario.id]);
        if (existingQ.rows.length > 0) {
            // Update existing submission
            const updateQ = `
        UPDATE entregas 
        SET archivo_nombre = COALESCE($1, archivo_nombre),
            archivo_path = COALESCE($2, archivo_path),
            comentario = $3,
            estado = $4,
            fecha_entrega = CURRENT_TIMESTAMP
        WHERE trabajo_id = $5 AND alumno_id = $6
      `;
            await conexion_pg_1.default.query(updateQ, [archivoNombre, archivoPath, comentario || '', estado, trabajoId, usuario.id]);
            return res.json({ success: true, message: 'Entrega actualizada correctamente' });
        }
        else {
            // Insert new submission
            const insertQ = `
        INSERT INTO entregas (trabajo_id, alumno_id, archivo_nombre, archivo_path, comentario, estado)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
            await conexion_pg_1.default.query(insertQ, [trabajoId, usuario.id, archivoNombre, archivoPath, comentario || '', estado]);
            return res.status(201).json({ success: true, message: 'Trabajo entregado exitosamente' });
        }
    }
    catch (error) {
        console.error('Error al entregar trabajo:', error);
        return res.status(500).json({ error: 'Error al procesar la entrega' });
    }
});
// DELETE /api/trabajos/:trabajoId/retirar - Withdraw submission (Student)
router.delete('/trabajos/:trabajoId/retirar', async (req, res) => {
    const { trabajoId } = req.params;
    const usuario = req.session?.usuario;
    if (!usuario || !usuario.id) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    try {
        const trabajoQ = await conexion_pg_1.default.query('SELECT clase_id FROM trabajos WHERE id = $1', [trabajoId]);
        if (trabajoQ.rows.length === 0) {
            return res.status(404).json({ error: 'Trabajo no encontrado.' });
        }
        const { permitido, motivo } = await (0, permisos_1.verificarAccesoClase)(usuario, trabajoQ.rows[0].clase_id);
        if (!permitido) {
            return res.status(403).json({ error: motivo || 'No perteneces a esta clase.' });
        }
        await conexion_pg_1.default.query('DELETE FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2', [trabajoId, usuario.id]);
        return res.json({ success: true, message: 'Entrega retirada correctamente' });
    }
    catch (error) {
        console.error('Error al retirar entrega:', error);
        return res.status(500).json({ error: 'Error al retirar la entrega' });
    }
});
// GET /api/trabajos/:trabajoId/entregas - List all students & submission status for a task (Teacher assigned / Admin)
router.get('/trabajos/:trabajoId/entregas', async (req, res) => {
    const { trabajoId } = req.params;
    const usuario = req.session?.usuario;
    if (!usuario || !usuario.id) {
        return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }
    if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
        return res.status(403).json({ error: 'No tienes permiso para ver entregas de otros alumnos.' });
    }
    try {
        const trabajoQ = await conexion_pg_1.default.query('SELECT clase_id FROM trabajos WHERE id = $1', [trabajoId]);
        if (trabajoQ.rows.length === 0) {
            return res.status(404).json({ error: 'Trabajo no encontrado.' });
        }
        const { permitido, motivo } = await (0, permisos_1.verificarAccesoClase)(usuario, trabajoQ.rows[0].clase_id);
        if (!permitido) {
            return res.status(403).json({ error: motivo || 'No tienes permisos sobre esta clase.' });
        }
        const query = `
      WITH alumnos_curso AS (
        SELECT DISTINCT u.id_usuario as alumno_id, u.nombre_completo as alumno_nombre, u.correo as alumno_correo
        FROM trabajos t
        JOIN clases c ON t.clase_id = c.id
        JOIN alumnos_clases ac ON LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))
        JOIN usuarios u ON ac.alumno_id = u.id_usuario
        WHERE t.id = $1
        UNION
        SELECT DISTINCT u.id_usuario as alumno_id, u.nombre_completo as alumno_nombre, u.correo as alumno_correo
        FROM entregas e
        JOIN usuarios u ON e.alumno_id = u.id_usuario
        WHERE e.trabajo_id = $1
      )
      SELECT 
        ac.alumno_id,
        ac.alumno_nombre,
        ac.alumno_correo,
        e.id as id,
        e.id as entrega_id,
        e.archivo_nombre,
        e.archivo_path,
        e.comentario,
        COALESCE(e.estado, 'sin_entregar') as estado,
        e.calificacion,
        e.feedback,
        e.fecha_entrega
      FROM alumnos_curso ac
      LEFT JOIN entregas e ON (e.trabajo_id = $1 AND e.alumno_id = ac.alumno_id)
      ORDER BY ac.alumno_nombre ASC
    `;
        const result = await conexion_pg_1.default.query(query, [trabajoId]);
        return res.json(result.rows || []);
    }
    catch (error) {
        console.error('Error al obtener entregas:', error);
        return res.status(500).json({ error: 'Error al obtener entregas' });
    }
});
// POST /api/entregas/:id/calificar - Grade submission by submission ID (Teacher assigned / Admin)
router.post('/entregas/:id/calificar', async (req, res) => {
    const { id } = req.params;
    const { calificacion, feedback } = req.body;
    const usuario = req.session?.usuario;
    if (!usuario || !usuario.id) {
        return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }
    if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
        return res.status(403).json({ error: 'Solo los profesores pueden calificar.' });
    }
    if (calificacion === undefined || calificacion === null) {
        return res.status(400).json({ error: 'La calificación es obligatoria.' });
    }
    try {
        const entregaQ = await conexion_pg_1.default.query(`SELECT e.alumno_id, t.clase_id, t.titulo, t.puntos_max 
       FROM entregas e 
       JOIN trabajos t ON e.trabajo_id = t.id 
       WHERE e.id = $1`, [id]);
        if (entregaQ.rows.length === 0) {
            return res.status(404).json({ error: 'Entrega no encontrada.' });
        }
        const { permitido, motivo } = await (0, permisos_1.verificarAccesoClase)(usuario, entregaQ.rows[0].clase_id);
        if (!permitido) {
            return res.status(403).json({ error: motivo || 'No tienes permisos para calificar en esta clase.' });
        }
        const updateQ = `
      UPDATE entregas 
      SET calificacion = $1, feedback = $2, estado = 'corregido', fecha_calificacion = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
        await conexion_pg_1.default.query(updateQ, [calificacion, feedback || '', id]);
        // Send notification to student
        const { alumno_id, titulo, puntos_max } = entregaQ.rows[0];
        const maxPts = puntos_max || 10;
        try {
            await conexion_pg_1.default.query(`INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'calificacion', $2, $3, 'entrega', $4)`, [alumno_id, `Trabajo calificado: ${titulo}`, `Tu entrega de "${titulo}" fue calificada con ${calificacion}/${maxPts}.`, id]);
        }
        catch (_e) { }
        return res.json({ success: true, message: 'Calificación guardada exitosamente' });
    }
    catch (error) {
        console.error('Error al calificar entrega:', error);
        return res.status(500).json({ error: 'Error al calificar la entrega' });
    }
});
// POST /api/trabajos/:trabajoId/alumnos/:alumnoId/calificar - Grade student directly (Teacher assigned / Admin)
router.post('/trabajos/:trabajoId/alumnos/:alumnoId/calificar', async (req, res) => {
    const { trabajoId, alumnoId } = req.params;
    const { calificacion, feedback } = req.body;
    const usuario = req.session?.usuario;
    if (!usuario || !usuario.id) {
        return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }
    if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
        return res.status(403).json({ error: 'Solo los profesores pueden calificar.' });
    }
    if (calificacion === undefined || calificacion === null) {
        return res.status(400).json({ error: 'La calificación es obligatoria.' });
    }
    try {
        const tQ = await conexion_pg_1.default.query('SELECT clase_id, titulo, puntos_max FROM trabajos WHERE id = $1', [trabajoId]);
        if (tQ.rows.length === 0) {
            return res.status(404).json({ error: 'Trabajo no encontrado.' });
        }
        const { permitido, motivo } = await (0, permisos_1.verificarAccesoClase)(usuario, tQ.rows[0].clase_id);
        if (!permitido) {
            return res.status(403).json({ error: motivo || 'No tienes permisos para calificar en esta clase.' });
        }
        const existingQ = await conexion_pg_1.default.query('SELECT id FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2', [trabajoId, alumnoId]);
        if (existingQ.rows.length > 0) {
            const updateQ = `
        UPDATE entregas 
        SET calificacion = $1, feedback = $2, estado = 'corregido', fecha_calificacion = CURRENT_TIMESTAMP
        WHERE trabajo_id = $3 AND alumno_id = $4
      `;
            await conexion_pg_1.default.query(updateQ, [calificacion, feedback || '', trabajoId, alumnoId]);
        }
        else {
            const insertQ = `
        INSERT INTO entregas (trabajo_id, alumno_id, calificacion, feedback, estado, fecha_calificacion)
        VALUES ($1, $2, $3, $4, 'corregido', CURRENT_TIMESTAMP)
      `;
            await conexion_pg_1.default.query(insertQ, [trabajoId, alumnoId, calificacion, feedback || '']);
        }
        // Send notification to student
        const titulo = tQ.rows[0]?.titulo || 'Trabajo';
        const maxPts = tQ.rows[0]?.puntos_max || 10;
        try {
            await conexion_pg_1.default.query(`INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'calificacion', $2, $3, 'trabajo', $4)`, [alumnoId, `Trabajo calificado: ${titulo}`, `Has recibido la nota ${calificacion}/${maxPts} en "${titulo}".`, trabajoId]);
        }
        catch (_e) { }
        return res.json({ success: true, message: 'Calificación guardada exitosamente' });
    }
    catch (error) {
        console.error('Error al calificar al alumno:', error);
        return res.status(500).json({ error: 'Error al calificar al alumno' });
    }
});
// GET /api/entregas/descargar/:filename - Download submission file
router.get('/entregas/descargar/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path_1.default.join(uploadsDir, filename);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    return res.download(filePath);
});
exports.default = router;
