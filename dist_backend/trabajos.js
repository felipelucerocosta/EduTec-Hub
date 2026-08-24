"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const router = (0, express_1.Router)();
// Helper to check user session
const getUserId = (req) => req.session?.usuario?.id;
// GET /api/clases/:claseId/trabajos - List assignments for a class
router.get('/clases/:claseId/trabajos', async (req, res) => {
    const { claseId } = req.params;
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    try {
        const query = `
      SELECT t.*, u.nombre_completo as creador_nombre
      FROM trabajos t
      LEFT JOIN usuarios u ON t.creado_por = u.id_usuario
      WHERE t.clase_id = $1
      ORDER BY t.fecha_creacion DESC
    `;
        const result = await conexion_pg_1.default.query(query, [claseId]);
        // Also attach student submission status if requested by a student
        const isAlumno = req.session?.usuario?.rol === 'alumno';
        if (isAlumno && result.rows.length > 0) {
            const entregasQ = `
        SELECT trabajo_id, id as entrega_id, estado, calificacion, fecha_entrega
        FROM entregas
        WHERE alumno_id = $1
      `;
            const entregasRes = await conexion_pg_1.default.query(entregasQ, [userId]);
            const entregasMap = new Map(entregasRes.rows.map((e) => [e.trabajo_id, e]));
            const rowsWithStatus = result.rows.map((t) => {
                const entrega = entregasMap.get(t.id);
                return {
                    ...t,
                    entrega: entrega || null,
                    mi_estado: entrega ? entrega.estado : 'sin_entregar'
                };
            });
            return res.json(rowsWithStatus);
        }
        return res.json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener trabajos:', error);
        return res.status(500).json({ error: 'Error al obtener trabajos' });
    }
});
// GET /api/trabajos/:id - Get detailed assignment info
router.get('/trabajos/:id', async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    try {
        const query = `
      SELECT t.*, c.nombre as clase_nombre, u.nombre_completo as creador_nombre
      FROM trabajos t
      JOIN clases c ON t.clase_id = c.id
      LEFT JOIN usuarios u ON t.creado_por = u.id_usuario
      WHERE t.id = $1
    `;
        const result = await conexion_pg_1.default.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Trabajo no encontrado' });
        }
        const trabajo = result.rows[0];
        // If student, attach their submission
        if (req.session?.usuario?.rol === 'alumno') {
            const entregaQ = `SELECT * FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2`;
            const entregaRes = await conexion_pg_1.default.query(entregaQ, [id, userId]);
            trabajo.mi_entrega = entregaRes.rows[0] || null;
        }
        return res.json(trabajo);
    }
    catch (error) {
        console.error('Error al obtener trabajo:', error);
        return res.status(500).json({ error: 'Error al obtener detalle del trabajo' });
    }
});
// POST /api/clases/:claseId/trabajos - Create new assignment (Teacher / Admin)
router.post('/clases/:claseId/trabajos', async (req, res) => {
    const { claseId } = req.params;
    const userId = getUserId(req);
    const userRol = req.session?.usuario?.rol;
    if (!userId || (userRol !== 'profesor' && userRol !== 'admin')) {
        return res.status(403).json({ error: 'Solo los profesores pueden crear trabajos.' });
    }
    const { titulo, descripcion, instrucciones, fecha_limite, puntos_max } = req.body;
    if (!titulo) {
        return res.status(400).json({ error: 'El título del trabajo es obligatorio.' });
    }
    try {
        const insertQ = `
      INSERT INTO trabajos (clase_id, titulo, descripcion, instrucciones, fecha_limite, puntos_max, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
        const result = await conexion_pg_1.default.query(insertQ, [
            claseId,
            titulo.trim(),
            descripcion ? descripcion.trim() : null,
            instrucciones ? instrucciones.trim() : null,
            fecha_limite || null,
            puntos_max || 100,
            userId
        ]);
        // Create notifications for enrolled students
        const alumnosQ = `
      SELECT alumno_id FROM alumnos_clases ac 
      JOIN clases c ON c.codigo = ac.codigo 
      WHERE c.id = $1
    `;
        const alumnosRes = await conexion_pg_1.default.query(alumnosQ, [claseId]);
        for (const alumno of alumnosRes.rows) {
            await conexion_pg_1.default.query(`INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'trabajo_nuevo', $2, $3, 'trabajo', $4)`, [alumno.alumno_id, `Nuevo trabajo: ${titulo}`, `Se ha publicado un nuevo trabajo en la clase.`, result.insertId]);
        }
        return res.status(201).json({ success: true, message: 'Trabajo publicado exitosamente', id: result.insertId });
    }
    catch (error) {
        console.error('Error al crear trabajo:', error);
        return res.status(500).json({ error: 'Error al crear trabajo' });
    }
});
// DELETE /api/trabajos/:id - Delete assignment
router.delete('/trabajos/:id', async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    const userRol = req.session?.usuario?.rol;
    if (!userId || (userRol !== 'profesor' && userRol !== 'admin')) {
        return res.status(403).json({ error: 'No tienes permisos para eliminar este trabajo.' });
    }
    try {
        await conexion_pg_1.default.query('DELETE FROM trabajos WHERE id = $1', [id]);
        return res.json({ success: true, message: 'Trabajo eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar trabajo:', error);
        return res.status(500).json({ error: 'Error al eliminar trabajo' });
    }
});
exports.default = router;
