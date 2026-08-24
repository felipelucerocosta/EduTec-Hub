"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conexion_pg_1 = __importDefault(require("./conexion_pg"));
const bcrypt = __importStar(require("bcrypt"));
const router = (0, express_1.Router)();
// ── Registro de alumno ────────────────────────────────────────
router.post('/registro-alumno', async (req, res) => {
    const { nombre_completo, correo, curso, DNI, contrasena } = req.body;
    if (!nombre_completo || !correo || !DNI || !contrasena) {
        return res.status(400).json({ error: 'Datos incompletos. Nombre, correo, DNI y contraseña son obligatorios.' });
    }
    try {
        // 1. Verificar si ya existe
        const verificarResult = await conexion_pg_1.default.query(`SELECT id_usuario FROM usuarios WHERE correo = ? OR DNI = ?`, [correo.toLowerCase().trim(), DNI.trim()]);
        if (verificarResult.rows.length > 0) {
            return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
        }
        // 2. Hashear contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        // 3. Insertar en usuarios
        const usuarioResult = await conexion_pg_1.default.query(`INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, curso, rol)
         VALUES (?, ?, ?, ?, ?, 'alumno')`, [hashedPassword, nombre_completo.trim(), correo.toLowerCase().trim(), DNI.trim(), curso || null]);
        // Obtener el ID del usuario recién insertado
        const ID_Usuario = usuarioResult.rows[0]?.id_usuario ?? usuarioResult.insertId;
        if (!ID_Usuario) {
            throw new Error('No se pudo obtener el ID del usuario creado.');
        }
        // 4. Obtener ID del curso (si existe)
        let ID_Curso = null;
        if (curso) {
            const cursoResult = await conexion_pg_1.default.query(`SELECT id_curso FROM curso WHERE nombre_curso = ?`, [curso]);
            ID_Curso = cursoResult.rows.length > 0 ? cursoResult.rows[0].id_curso : null;
        }
        // 5. Separar nombre y apellido
        const partes = nombre_completo.trim().split(' ');
        const nombre = partes[0];
        const apellido = partes.slice(1).join(' ') || '';
        // 6. Insertar en tabla alumno
        await conexion_pg_1.default.query(`INSERT INTO alumno (DNI, nombre_completo, apellido, id_curso, id_usuario, correo, contrasena)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [DNI.trim(), nombre, apellido, ID_Curso, ID_Usuario, correo.toLowerCase().trim(), hashedPassword]);
        return res.status(201).json({ success: true, message: '¡Alumno registrado exitosamente!' });
    }
    catch (err) {
        console.error('Error en registro de alumno:', err);
        if (err.message?.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
        }
        return res.status(500).json({ error: 'Error interno del servidor al registrar el alumno.' });
    }
});
// ── Registro de profesor ──────────────────────────────────────
router.post('/registro-profesor', async (req, res) => {
    const { nombre_completo, correo, materia, DNI, contrasena } = req.body;
    if (!nombre_completo || !correo || !DNI || !contrasena) {
        return res.status(400).json({ error: 'Datos incompletos. Nombre, correo, DNI y contraseña son obligatorios.' });
    }
    try {
        // 1. Verificar si ya existe
        const verificarResult = await conexion_pg_1.default.query(`SELECT id_usuario FROM usuarios WHERE correo = ? OR DNI = ?`, [correo.toLowerCase().trim(), DNI.trim()]);
        if (verificarResult.rows.length > 0) {
            return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
        }
        // 2. Hashear contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        // 3. Insertar en usuarios (sin campo 'usuario' — no existe en el schema)
        const usuarioResult = await conexion_pg_1.default.query(`INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, rol)
         VALUES (?, ?, ?, ?, 'profesor')`, [hashedPassword, nombre_completo.trim(), correo.toLowerCase().trim(), DNI.trim()]);
        // Obtener el ID del usuario recién insertado
        const ID_Usuario = usuarioResult.rows[0]?.id_usuario ?? usuarioResult.insertId;
        if (!ID_Usuario) {
            throw new Error('No se pudo obtener el ID del usuario creado.');
        }
        // 4. Insertar en tabla profesor
        await conexion_pg_1.default.query(`INSERT INTO profesor (id_usuario, correo, DNI, nombre_completo, materia, contrasena)
         VALUES (?, ?, ?, ?, ?, ?)`, [ID_Usuario, correo.toLowerCase().trim(), DNI.trim(), nombre_completo.trim(), materia || '', hashedPassword]);
        return res.status(201).json({ success: true, message: '¡Profesor registrado exitosamente!' });
    }
    catch (err) {
        console.error('Error en registro de profesor:', err);
        if (err.message?.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
        }
        return res.status(500).json({ error: 'Error interno del servidor al registrar el profesor.' });
    }
});
exports.default = router;
