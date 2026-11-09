"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const permisos_1 = require("./permisos");
const router = (0, express_1.Router)();
// GET /api/clases - Obtener lista de clases filtrada según el rol y asignación del usuario
router.get('/clases', async (req, res) => {
    const usuario = req.session?.usuario;
    if (!usuario || !usuario.id) {
        return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }
    try {
        let sql;
        let params = [];
        if (usuario.rol === 'admin' || usuario.isAdmin) {
            // Administrador ve todas las clases
            sql = `
        SELECT 
          c.id, 
          c.nombre, 
          c.seccion, 
          c.materia, 
          c.aula, 
          c.creador, 
          c.codigo,
          c.titular_id,
          (SELECT COUNT(*) FROM alumnos_clases ac WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos,
          (SELECT COUNT(*) FROM trabajos t WHERE t.clase_id = c.id) AS total_trabajos
        FROM clases c
        ORDER BY c.id DESC
      `;
        }
        else if (usuario.rol === 'profesor') {
            // Profesor ve únicamente las clases donde está asignado
            sql = `
        SELECT DISTINCT
          c.id, 
          c.nombre, 
          c.seccion, 
          c.materia, 
          c.aula, 
          c.creador, 
          c.codigo,
          c.titular_id,
          (SELECT COUNT(*) FROM alumnos_clases ac WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos,
          (SELECT COUNT(*) FROM trabajos t WHERE t.clase_id = c.id) AS total_trabajos
        FROM clases c
        LEFT JOIN profesores_clases pc ON pc.clase_id = c.id
        WHERE c.titular_id = $1 OR pc.profesor_id = $1
        ORDER BY c.id DESC
      `;
            params = [usuario.id];
        }
        else {
            // Alumno ve únicamente las clases donde está inscripto
            sql = `
        SELECT DISTINCT
          c.id, 
          c.nombre, 
          c.seccion, 
          c.materia, 
          c.aula, 
          c.creador, 
          c.codigo,
          c.titular_id,
          (SELECT COUNT(*) FROM alumnos_clases ac2 WHERE LOWER(TRIM(ac2.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos,
          (SELECT COUNT(*) FROM trabajos t WHERE t.clase_id = c.id) AS total_trabajos
        FROM clases c
        INNER JOIN alumnos_clases ac ON LOWER(TRIM(c.codigo)) = LOWER(TRIM(ac.codigo))
        WHERE ac.alumno_id = $1
        ORDER BY c.id DESC
      `;
            params = [usuario.id];
        }
        const result = await conexion_pg_1.default.query(sql, params);
        const rows = result && result.rows ? result.rows : [];
        return res.json(rows);
    }
    catch (err) {
        console.error('❌ Error al consultar clases:', err);
        return res.status(500).json({ error: 'Error al obtener clases' });
    }
});
// GET /api/clases/:id - Obtener detalle de una clase verificando permisos estrictos
router.get('/clases/:id', async (req, res) => {
    const { id } = req.params;
    const usuario = req.session?.usuario;
    if (!usuario || !usuario.id) {
        return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }
    try {
        const { permitido, clase, motivo } = await (0, permisos_1.verificarAccesoClase)(usuario, id);
        if (!permitido || !clase) {
            return res.status(403).json({ error: motivo || 'No tienes permisos para acceder a esta clase.' });
        }
        // Obtener estadísticas de la clase
        const [alumnosCount, trabajosCount] = await Promise.all([
            conexion_pg_1.default.query('SELECT COUNT(*) as total FROM alumnos_clases WHERE LOWER(TRIM(codigo)) = LOWER(TRIM($1))', [clase.codigo]),
            conexion_pg_1.default.query('SELECT COUNT(*) as total FROM trabajos WHERE clase_id = $1', [clase.id])
        ]);
        return res.json({
            ...clase,
            cantidad_alumnos: Number(alumnosCount.rows[0]?.total || 0),
            total_trabajos: Number(trabajosCount.rows[0]?.total || 0)
        });
    }
    catch (err) {
        console.error('❌ Error al obtener detalle de clase:', err);
        return res.status(500).json({ error: 'Error al obtener la clase' });
    }
});
exports.default = router;
