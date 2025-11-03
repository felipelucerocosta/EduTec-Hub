import { Router, Request, Response } from 'express';
import pool from './conexion_be';
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

// Registro de alumno
router.post(
  '/registro-alumno',
  async (req: Request<{}, any, RegistroAlumnoBody>, res: Response) => {
    const { nombre_completo, correo, curso, DNI, contrasena } = req.body;

    if (!nombre_completo || !correo || !curso || !DNI || !contrasena) {
      return res.status(400).send('Datos incompletos.');
    }

    // Validar dominio institucional para alumnos
    if (!correo.endsWith('@alu.tecnica29de6.edu.ar')) {
      return res.status(400).send('Solo se permiten correos institucionales de alumnos (@alu.tecnica29de6.edu.ar).');
    }

    try {
      // 1. Verificar si el usuario ya existe
      const verificarQuery = `SELECT * FROM usuarios WHERE correo = $1 OR DNI = $2`;
      const verificarResult = await pool.query(verificarQuery, [correo, DNI]);

      if (verificarResult.rows.length > 0) {
        return res.send('El correo o DNI ya está registrado.');
      }

      // Hasheamos la contraseña antes de guardarla
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

      // Insertar en la tabla principal de usuarios
      const insertUsuario = `
        INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, curso)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING ID_Usuario
      `;
      const usuarioResult = await pool.query(insertUsuario, [
        hashedPassword,
        nombre_completo,
        correo,
        DNI,
        curso,
      ]);
      const ID_Usuario = usuarioResult.rows[0].id_usuario;

      // Insertar en la tabla "alumno"
      const [nombre, ...resto] = nombre_completo.split(' ');
      const apellido = resto.join(' ');

      const cursoResult = await pool.query(
        `SELECT ID_Curso FROM curso WHERE nombre_curso = $1`,
        [curso]
      );
      const ID_Curso = cursoResult.rows.length > 0 ? cursoResult.rows[0].id_curso : null;

      const insertAlumno = `
        INSERT INTO alumno (DNI, nombre_completo, apellido, ID_Curso, ID_Usuario, correo, contrasena)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await pool.query(insertAlumno, [
        DNI,
        nombre,
        apellido,
        ID_Curso,
        ID_Usuario,
        correo,
        hashedPassword,
      ]);

      res.send('¡Alumno registrado exitosamente!');
    } catch (err) {
      console.error('Error en registro de alumno:', err);
      res.status(500).send('Error interno del servidor.');
    }
  }
);

// Registro de profesor
router.post(
  '/registro-profesor',
  async (req: Request<{}, any, RegistroProfesorBody>, res: Response) => {
    const { nombre_completo, correo, materia, DNI, contrasena } = req.body;

    if (!nombre_completo || !correo || !materia || !DNI || !contrasena) {
      return res.status(400).send('Datos incompletos.');
    }

    // Validar dominio institucional para profesores
    if (!correo.endsWith('@tecnica29de6.edu.ar') || correo.includes('@alu.')) {
      return res.status(400).send('Solo se permiten correos institucionales de profesores (@tecnica29de6.edu.ar).');
    }

    try {
      // 1. Verificar si el usuario ya existe
      const verificarQuery = `SELECT * FROM usuarios WHERE correo = $1 OR DNI = $2`;
      const verificarResult = await pool.query(verificarQuery, [correo, DNI]);

      if (verificarResult.rows.length > 0) {
        return res.send('El correo o DNI ya está registrado.');
      }

      // Hasheamos la contraseña antes de guardarla
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

      const insertUsuario = `
        INSERT INTO usuarios (contrasena, usuario, nombre_completo, correo, DNI, curso)
        VALUES ($1, $2, $3, $4, $5, NULL)
        RETURNING ID_Usuario
      `;
      const usuarioResult = await pool.query(insertUsuario, [
        hashedPassword,
        correo,
        nombre_completo,
        correo,
        DNI,
      ]);
      const ID_Usuario = usuarioResult.rows[0].id_usuario;

      // Insertar en la tabla específica de profesores
      const insertProfesor = `
        INSERT INTO profesor (ID_Usuario, correo, DNI, nombre_completo, materia, contrasena)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await pool.query(insertProfesor, [
        ID_Usuario,
        correo,
        DNI,
        nombre_completo,
        materia,
        hashedPassword,
      ]);

      res.send('¡Profesor registrado exitosamente!');
    } catch (err) {
      console.error('Error en registro de profesor:', err);
      res.status(500).send('Error interno del servidor.');
    }
  }
);

export default router;
