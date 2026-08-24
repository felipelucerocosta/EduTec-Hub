"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const router = (0, express_1.Router)();
const getUserId = (req) => req.session?.usuario?.id;
// Simuladores por keyword de materia (arquitectura extensible)
const SIMULADORES_CATALOGO = {
    matematica: [
        { tipo: 'ecuaciones', nombre: 'Sistema de Ecuaciones', descripcion: 'Visualiza y resuelve sistemas de dos ecuaciones lineales. Observa el punto de intersección y detecta si hay una, ninguna o infinitas soluciones.' },
        { tipo: 'funciones', nombre: 'Laboratorio de Funciones', descripcion: 'Grafica funciones matemáticas, explora raíces, vértice e intersecciones modificando los coeficientes en tiempo real.' },
        { tipo: 'geometria', nombre: 'Geometría Interactiva', descripcion: 'Manipula figuras geométricas (cuadrado, rectángulo, triángulo, círculo) y observa cómo cambian el área y el perímetro.' },
    ],
    redes: [
        { tipo: 'topologias', nombre: 'Topologías de Red', descripcion: 'Explora las topologías de red (Bus, Estrella, Anillo, Malla) y comprende sus ventajas y desventajas.' },
        { tipo: 'direccionamiento', nombre: 'Direccionamiento IP', descripcion: 'Practica el cálculo de subredes, máscaras de subred y rangos de direcciones IP.' },
    ],
    desarrollo: [
        { tipo: 'metodologias', nombre: 'Simulador de Metodologías', descripcion: 'Experimenta con Waterfall, Scrum y Kanban. Modifica variables del equipo y observa el impacto en el proyecto.' },
        { tipo: 'ciclo_vida', nombre: 'Ciclo de Vida del Software', descripcion: 'Explora las etapas del ciclo de vida del desarrollo de software y sus características.' },
    ],
    programacion: [
        { tipo: 'metodologias', nombre: 'Simulador de Proyectos', descripcion: 'Simula el desarrollo de un proyecto de software con diferentes configuraciones de equipo y metodología.' },
    ],
};
// Función para normalizar texto a keyword
function getKeyword(materia) {
    const m = materia.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, '').trim();
    if (m.includes('matem'))
        return 'matematica';
    if (m.includes('red') || m.includes('network'))
        return 'redes';
    if (m.includes('desarrollo') || m.includes('sistemas'))
        return 'desarrollo';
    if (m.includes('program'))
        return 'programacion';
    return 'general';
}
// ─────────────────────────────────────────────────────────────
// GET /api/simuladores/:claseId
// Simuladores disponibles para una clase específica
// ─────────────────────────────────────────────────────────────
router.get('/simuladores/:claseId', async (req, res) => {
    const { claseId } = req.params;
    const userId = getUserId(req);
    if (!userId)
        return res.status(401).json({ error: 'No autorizado' });
    try {
        const claseRes = await conexion_pg_1.default.query('SELECT materia, nombre FROM clases WHERE id = $1', [claseId]);
        if (claseRes.rows.length === 0)
            return res.status(404).json({ error: 'Clase no encontrada' });
        const clase = claseRes.rows[0];
        const keyword = getKeyword(clase.materia || clase.nombre || '');
        const simuladoresCatalogo = SIMULADORES_CATALOGO[keyword] || [];
        // Simuladores personalizados de la DB para esta clase (si existen)
        const simDB = await conexion_pg_1.default.query('SELECT * FROM simuladores WHERE (clase_id = $1 OR materia_keyword = $2) AND activo = 1', [claseId, keyword]);
        return res.json({
            clase: { id: claseId, nombre: clase.nombre, materia: clase.materia },
            keyword,
            simuladores: simuladoresCatalogo,
            simuladores_custom: simDB.rows,
        });
    }
    catch (error) {
        console.error('Error al obtener simuladores:', error);
        return res.status(500).json({ error: 'Error al obtener simuladores' });
    }
});
// ─────────────────────────────────────────────────────────────
// POST /api/simuladores/sesion
// Registrar una sesión de simulador completada
// ─────────────────────────────────────────────────────────────
router.post('/simuladores/sesion', async (req, res) => {
    const userId = getUserId(req);
    if (!userId)
        return res.status(401).json({ error: 'No autorizado' });
    const { simulador_tipo, clase_id, datos_sesion, duracion_segundos } = req.body;
    if (!simulador_tipo)
        return res.status(400).json({ error: 'Tipo de simulador requerido' });
    try {
        // Buscar o crear el simulador en DB
        let simId;
        const simExistRes = await conexion_pg_1.default.query('SELECT id FROM simuladores WHERE tipo = $1 AND (clase_id = $2 OR clase_id IS NULL) LIMIT 1', [simulador_tipo, clase_id || null]);
        if (simExistRes.rows.length > 0) {
            simId = simExistRes.rows[0].id;
        }
        else {
            const claseRes = clase_id
                ? await conexion_pg_1.default.query('SELECT materia FROM clases WHERE id = $1', [clase_id])
                : { rows: [{ materia: 'general' }] };
            const materia = claseRes.rows[0]?.materia || 'general';
            const keyword = getKeyword(materia);
            const insertRes = await conexion_pg_1.default.query(`INSERT INTO simuladores (materia_keyword, nombre, tipo, clase_id) VALUES ($1, $2, $3, $4) RETURNING id`, [keyword, simulador_tipo, simulador_tipo, clase_id || null]);
            simId = insertRes.rows[0]?.id || insertRes.insertId;
        }
        await conexion_pg_1.default.query(`INSERT INTO sesiones_simulador (simulador_id, usuario_id, datos_sesion, completado, duracion_segundos) VALUES ($1, $2, $3, 1, $4)`, [simId, userId, datos_sesion ? JSON.stringify(datos_sesion) : null, duracion_segundos || null]);
        return res.status(201).json({ success: true, message: 'Sesión registrada' });
    }
    catch (error) {
        console.error('Error al guardar sesión:', error);
        return res.status(500).json({ error: 'Error al guardar sesión del simulador' });
    }
});
// ─────────────────────────────────────────────────────────────
// GET /api/simuladores/mis-sesiones
// Historial de sesiones del alumno
// ─────────────────────────────────────────────────────────────
router.get('/simuladores/mis-sesiones', async (req, res) => {
    const userId = getUserId(req);
    if (!userId)
        return res.status(401).json({ error: 'No autorizado' });
    try {
        const query = `
      SELECT ss.id, ss.creado_en, ss.duracion_segundos, ss.completado,
             s.nombre as simulador_nombre, s.tipo as simulador_tipo
      FROM sesiones_simulador ss
      JOIN simuladores s ON s.id = ss.simulador_id
      WHERE ss.usuario_id = $1
      ORDER BY ss.creado_en DESC
      LIMIT 50
    `;
        const result = await conexion_pg_1.default.query(query, [userId]);
        return res.json(result.rows);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error al obtener historial' });
    }
});
exports.default = router;
