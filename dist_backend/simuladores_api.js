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
        { tipo: 'ecuaciones', nombre: 'Sistema de Ecuaciones', descripcion: 'Plano cartesiano interactivo con 2 rectas, punto de intersección (X,Y) y detección en tiempo real de 1, 0 o infinitas soluciones.' },
        { tipo: 'funciones', nombre: 'Laboratorio de Funciones', descripcion: 'Grafica f(x) = ax² + bx + c y funciones lineales. Modifica coeficientes a, b, c en vivo y visualiza raíces, vértice e intersección.' },
        { tipo: 'geometria', nombre: 'Geometría Interactiva 2D/3D', descripcion: 'Manipula vértices, dimensiones y figuras (polígonos, círculos, cubos, esferas) observando área, perímetro y volumen en vivo.' },
        { tipo: 'probabilidad', nombre: 'Probabilidad y Estadística', descripcion: 'Laboratorio de experimentos aleatorios (monedas, dados). Ejecuta de 10 a 1000 tiradas y compara Probabilidad Teórica vs. Experimental.' },
    ],
    redes: [
        { tipo: 'topologias', nombre: 'Constructor de Topologías y Tráfico', descripcion: 'Diseña redes con PCs, Switches, Routers y Servidores. Visualiza paquetes de datos animados, latencia y cortes de enlaces.' },
        { tipo: 'direccionamiento', nombre: 'Direccionamiento IP y Subredes', descripcion: 'Calculador visual de subredes, máscaras CIDR, rangos de IP útiles y distribución de direcciones en la topología.' },
    ],
    desarrollo: [
        { tipo: 'metodologias', nombre: 'Simulador de Metodologías Ágiles', descripcion: 'Compara Scrum, Waterfall y Kanban. Modifica cantidad de devs, complejidad, tiempo, tasa de errores y retrabajo con avance tipo Gantt.' },
        { tipo: 'proyectos_evolucion', nombre: 'Evolución de Proyectos', descripcion: 'Monitorea métricas de rendimiento, velocidad de equipo, bugs resueltos y tasa de entrega a lo largo de los sprints.' },
    ],
    lengua: [
        { tipo: 'analisis_textual', nombre: 'Laboratorio de Análisis Textual', descripcion: 'Experimenta con análisis gramatical, sintáctico y categórico. Visualiza la estructura del texto, palabras clave y legibilidad.' },
    ],
    ciencia: [
        { tipo: 'fisica_circuitos', nombre: 'Laboratorio de Física y Circuitos', descripcion: 'Simula circuitos eléctricos aplicando Ley de Ohm (V = I * R) y movimientos físicos observando velocidad y aceleración.' },
    ],
};
// Función para normalizar texto a keyword
function getKeyword(materia) {
    const m = materia.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, '').trim();
    if (m.includes('matem') || m.includes('algeb') || m.includes('calc'))
        return 'matematica';
    if (m.includes('red') || m.includes('network') || m.includes('telecom'))
        return 'redes';
    if (m.includes('desarrollo') || m.includes('sistema') || m.includes('practic'))
        return 'desarrollo';
    if (m.includes('program') || m.includes('soft'))
        return 'desarrollo';
    if (m.includes('lengua') || m.includes('literat') || m.includes('ciudadan') || m.includes('texto'))
        return 'lengua';
    if (m.includes('fisic') || m.includes('electr') || m.includes('cienc') || m.includes('quim'))
        return 'ciencia';
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
