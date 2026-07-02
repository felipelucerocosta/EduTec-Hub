import { Router, Request, Response } from 'express';
import pool from './conexion_pg';
import * as bcrypt from 'bcrypt';

const router = Router();

interface RegistroAlumnoBody {
  nombre_completo: string;
  correo: string;
  curso: string;
  DNI: string;
  contrasena: string;
}

interface RegistroProfesorBody {
  nombre_completo: string;
  correo: string;
  materia: string;
  DNI: string;
  contrasena: string;
}

// ── Registro de alumno ────────────────────────────────────────
router.post(
  '/registro-alumno',
  async (req: Request<{}, any, RegistroAlumnoBody>, res: Response) => {
    const { nombre_completo, correo, curso, DNI, contrasena } = req.body;

    if (!nombre_completo || !correo || !DNI || !contrasena) {
      return res.status(400).json({ error: 'Datos incompletos. Nombre, correo, DNI y contraseña son obligatorios.' });
    }

    try {
      // 1. Verificar si ya existe
      const verificarResult = await pool.query(
        `SELECT id_usuario FROM usuarios WHERE correo = ? OR DNI = ?`,
        [correo.toLowerCase().trim(), DNI.trim()]
      );
      if (verificarResult.rows.length > 0) {
        return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
      }

      // 2. Hashear contraseña
      const hashedPassword = await bcrypt.hash(contrasena, 10);

      // 3. Insertar en usuarios
      const usuarioResult = await pool.query(
        `INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, curso, rol)
         VALUES (?, ?, ?, ?, ?, 'alumno')`,
        [hashedPassword, nombre_completo.trim(), correo.toLowerCase().trim(), DNI.trim(), curso || null]
      );

      // Obtener el ID del usuario recién insertado
      const ID_Usuario = usuarioResult.rows[0]?.id_usuario ?? usuarioResult.insertId;
      if (!ID_Usuario) {
        throw new Error('No se pudo obtener el ID del usuario creado.');
      }

      // 4. Obtener ID del curso (si existe)
      let ID_Curso: number | null = null;
      if (curso) {
        const cursoResult = await pool.query(
          `SELECT id_curso FROM curso WHERE nombre_curso = ?`,
          [curso]
        );
        ID_Curso = cursoResult.rows.length > 0 ? cursoResult.rows[0].id_curso : null;
      }

      // 5. Separar nombre y apellido
      const partes = nombre_completo.trim().split(' ');
      const nombre = partes[0];
      const apellido = partes.slice(1).join(' ') || '';

      // 6. Insertar en tabla alumno
      await pool.query(
        `INSERT INTO alumno (DNI, nombre_completo, apellido, id_curso, id_usuario, correo, contrasena)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [DNI.trim(), nombre, apellido, ID_Curso, ID_Usuario, correo.toLowerCase().trim(), hashedPassword]
      );

      return res.status(201).json({ success: true, message: '¡Alumno registrado exitosamente!' });
    } catch (err: any) {
      console.error('Error en registro de alumno:', err);
      if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
      }
      return res.status(500).json({ error: 'Error interno del servidor al registrar el alumno.' });
    }
  }
);

// ── Registro de profesor ──────────────────────────────────────
router.post(
  '/registro-profesor',
  async (req: Request<{}, any, RegistroProfesorBody>, res: Response) => {
    const { nombre_completo, correo, materia, DNI, contrasena } = req.body;

    if (!nombre_completo || !correo || !DNI || !contrasena) {
      return res.status(400).json({ error: 'Datos incompletos. Nombre, correo, DNI y contraseña son obligatorios.' });
    }

    try {
      // 1. Verificar si ya existe
      const verificarResult = await pool.query(
        `SELECT id_usuario FROM usuarios WHERE correo = ? OR DNI = ?`,
        [correo.toLowerCase().trim(), DNI.trim()]
      );
      if (verificarResult.rows.length > 0) {
        return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
      }

      // 2. Hashear contraseña
      const hashedPassword = await bcrypt.hash(contrasena, 10);

      // 3. Insertar en usuarios (sin campo 'usuario' — no existe en el schema)
      const usuarioResult = await pool.query(
        `INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, rol)
         VALUES (?, ?, ?, ?, 'profesor')`,
        [hashedPassword, nombre_completo.trim(), correo.toLowerCase().trim(), DNI.trim()]
      );

      // Obtener el ID del usuario recién insertado
      const ID_Usuario = usuarioResult.rows[0]?.id_usuario ?? usuarioResult.insertId;
      if (!ID_Usuario) {
        throw new Error('No se pudo obtener el ID del usuario creado.');
      }

      // 4. Insertar en tabla profesor
      await pool.query(
        `INSERT INTO profesor (id_usuario, correo, DNI, nombre_completo, materia, contrasena)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ID_Usuario, correo.toLowerCase().trim(), DNI.trim(), nombre_completo.trim(), materia || '', hashedPassword]
      );

      return res.status(201).json({ success: true, message: '¡Profesor registrado exitosamente!' });
    } catch (err: any) {
      console.error('Error en registro de profesor:', err);
      if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
      }
      return res.status(500).json({ error: 'Error interno del servidor al registrar el profesor.' });
    }
  }
);

export default router;
