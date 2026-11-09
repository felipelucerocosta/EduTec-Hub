"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const permisos_1 = require("./permisos");
const router = (0, express_1.Router)();
function getIo() {
    try {
        const serverModule = require('./server');
        return serverModule.io;
    }
    catch (err) {
        return null;
    }
}
// POST /api/guardar-mensaje - Post message/announcement to a class
router.post('/guardar-mensaje', async (req, res) => {
    const { mensaje, clase_id } = req.body;
    const usuario = req.session?.usuario;
    if (!usuario || !usuario.id) {
        return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }
    if (!mensaje || mensaje.trim() === '') {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }
    let targetClaseId = clase_id ? Number(clase_id) : null;
    // Si no se envió clase_id explícito, buscar la primera clase asignada del usuario
    if (!targetClaseId && usuario.rol !== 'admin' && !usuario.isAdmin) {
        try {
            if (usuario.rol === 'profesor') {
                const pQ = await conexion_pg_1.default.query(`SELECT id FROM clases WHERE titular_id = $1 UNION SELECT clase_id as id FROM profesores_clases WHERE profesor_id = $1 LIMIT 1`, [usuario.id]);
                targetClaseId = pQ.rows[0]?.id || null;
            }
            else {
                const aQ = await conexion_pg_1.default.query(`SELECT c.id FROM clases c JOIN alumnos_clases ac ON LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo)) WHERE ac.alumno_id = $1 LIMIT 1`, [usuario.id]);
                targetClaseId = aQ.rows[0]?.id || null;
            }
        }
        catch (_e) { }
        if (!targetClaseId) {
            return res.status(403).json({ error: 'No tienes clases asignadas para publicar mensajes.' });
        }
    }
    // Si hay clase_id, verificar permisos
    if (targetClaseId) {
        const { permitido, motivo } = await (0, permisos_1.verificarAccesoClase)(usuario, targetClaseId);
        if (!permitido) {
            return res.status(403).json({ error: motivo || 'No perteneces a esta clase.' });
        }
    }
    const cleanMensaje = mensaje.trim();
    const userId = usuario.id;
    const userNombre = usuario.nombre || 'Usuario';
    const userRol = usuario.rol || 'alumno';
    try {
        if (targetClaseId) {
            const insertRes = await conexion_pg_1.default.query('INSERT INTO anuncios (clase_id, autor_id, contenido) VALUES ($1, $2, $3) RETURNING id', [targetClaseId, userId, cleanMensaje]);
            const insertedId = insertRes.rows?.[0]?.id || insertRes.insertId || Date.now();
            const nuevoMensaje = {
                id: insertedId,
                mensaje: cleanMensaje,
                fecha: new Date().toISOString(),
                usuario: userNombre,
                usuario_id: userId,
                rol: userRol,
                clase_id: targetClaseId
            };
            const io = getIo();
            if (io) {
                io.emit('nuevo_mensaje', nuevoMensaje);
            }
            return res.status(201).json({ success: true, message: 'Mensaje publicado', nuevoMensaje });
        }
        else {
            // Global forum para admin
            const insertRes = await conexion_pg_1.default.query('INSERT INTO tablon_mensajes (mensaje, usuario_id, usuario_nombre) VALUES ($1, $2, $3) RETURNING id', [cleanMensaje, userId, userNombre]);
            const insertedId = insertRes.rows?.[0]?.id || insertRes.insertId || Date.now();
            const nuevoMensaje = {
                id: insertedId,
                mensaje: cleanMensaje,
                fecha: new Date().toISOString(),
                usuario: userNombre,
                usuario_id: userId,
                rol: userRol
            };
            const io = getIo();
            if (io) {
                io.emit('nuevo_mensaje', nuevoMensaje);
            }
            return res.status(201).json({ success: true, message: 'Mensaje publicado', nuevoMensaje });
        }
    }
    catch (err) {
        console.error('❌ Error al guardar mensaje:', err);
        return res.status(500).json({ error: 'Error al guardar el mensaje' });
    }
});
// GET /api/mensajes - List announcements for user's assigned classes
router.get('/mensajes', async (req, res) => {
    const clase_id = req.query.clase_id;
    const usuario = req.session?.usuario;
    if (!usuario || !usuario.id) {
        return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }
    try {
        if (clase_id) {
            const { permitido, motivo } = await (0, permisos_1.verificarAccesoClase)(usuario, Number(clase_id));
            if (!permitido) {
                return res.status(403).json({ error: motivo || 'No tienes acceso a esta clase.' });
            }
            const query = `
        SELECT a.id, a.contenido as mensaje, a.fecha, 
               COALESCE(u.nombre_completo, 'Usuario') as usuario, 
               a.autor_id as usuario_id,
               COALESCE(u.rol, 'profesor') as rol,
               a.clase_id,
               c.nombre as clase_nombre
        FROM anuncios a
        LEFT JOIN usuarios u ON a.autor_id = u.id_usuario
        LEFT JOIN clases c ON a.clase_id = c.id
        WHERE a.clase_id = $1
        ORDER BY a.fecha DESC
        LIMIT 50
      `;
            const result = await conexion_pg_1.default.query(query, [clase_id]);
            return res.json(result.rows || []);
        }
        else {
            // Filtrar según clases asignadas al usuario
            if (usuario.rol === 'admin' || usuario.isAdmin) {
                const query = `
          SELECT a.id, a.contenido as mensaje, a.fecha, 
                 COALESCE(u.nombre_completo, 'Usuario') as usuario, 
                 a.autor_id as usuario_id,
                 COALESCE(u.rol, 'profesor') as rol,
                 a.clase_id,
                 c.nombre as clase_nombre
          FROM anuncios a
          LEFT JOIN usuarios u ON a.autor_id = u.id_usuario
          LEFT JOIN clases c ON a.clase_id = c.id
          ORDER BY a.fecha DESC
          LIMIT 50
        `;
                const result = await conexion_pg_1.default.query(query);
                return res.json(result.rows || []);
            }
            else if (usuario.rol === 'profesor') {
                const query = `
          SELECT a.id, a.contenido as mensaje, a.fecha, 
                 COALESCE(u.nombre_completo, 'Usuario') as usuario, 
                 a.autor_id as usuario_id,
                 COALESCE(u.rol, 'profesor') as rol,
                 a.clase_id,
                 c.nombre as clase_nombre
          FROM anuncios a
          LEFT JOIN usuarios u ON a.autor_id = u.id_usuario
          LEFT JOIN clases c ON a.clase_id = c.id
          WHERE a.clase_id IN (
            SELECT id FROM clases WHERE titular_id = $1
            UNION
            SELECT clase_id FROM profesores_clases WHERE profesor_id = $1
          )
          ORDER BY a.fecha DESC
          LIMIT 50
        `;
                const result = await conexion_pg_1.default.query(query, [usuario.id]);
                return res.json(result.rows || []);
            }
            else {
                // Alumno: solo anuncios de sus clases
                const query = `
          SELECT a.id, a.contenido as mensaje, a.fecha, 
                 COALESCE(u.nombre_completo, 'Usuario') as usuario, 
                 a.autor_id as usuario_id,
                 COALESCE(u.rol, 'profesor') as rol,
                 a.clase_id,
                 c.nombre as clase_nombre
          FROM anuncios a
          LEFT JOIN usuarios u ON a.autor_id = u.id_usuario
          LEFT JOIN clases c ON a.clase_id = c.id
          WHERE a.clase_id IN (
            SELECT c2.id FROM clases c2
            JOIN alumnos_clases ac ON LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c2.codigo))
            WHERE ac.alumno_id = $1
          )
          ORDER BY a.fecha DESC
          LIMIT 50
        `;
                const result = await conexion_pg_1.default.query(query, [usuario.id]);
                return res.json(result.rows || []);
            }
        }
    }
    catch (err) {
        console.error('❌ Error al obtener mensajes:', err);
        return res.status(500).json({ error: 'Error en el servidor al obtener mensajes' });
    }
});
exports.default = router;
