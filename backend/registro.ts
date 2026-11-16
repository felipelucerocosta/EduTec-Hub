import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';
import * as bcrypt from 'bcrypt';

const router = Router();

interface RegistroAlumnoBody {
  nombre_completo: string;
  correo: string;
  curso: string;
  nivel_educativo?: string;
  DNI: string;
  contrasena: string;
}

interface RegistroProfesorBody {
  nombre_completo: string;
  correo: string;
  materia: string;
  nivel_educativo?: string;
  DNI: string;
  contrasena: string;
}

interface RegistroPreceptorBody {
  nombre_completo: string;
  correo: string;
  DNI: string;
  contrasena: string;
  nivel_educativo?: string;
  turno?: string;
}

// ── Registro de alumno ────────────────────────────────────────
router.post(
  '/registro-alumno',
  async (req: Request<{}, any, RegistroAlumnoBody>, res: Response) => {
    const { nombre_completo, correo, curso, nivel_educativo, DNI, contrasena } = req.body;

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

      // Iniciar transacción para garantizar persistencia atómica
      await pool.query('BEGIN TRANSACTION');

      try {
        // 3. Insertar en usuarios con estado PENDIENTE_DE_ASIGNACION
        const usuarioResult = await pool.query(
          `INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, curso, nivel_educativo, rol, estado_acceso)
           VALUES (?, ?, ?, ?, ?, ?, 'alumno', 'PENDIENTE_DE_ASIGNACION')`,
          [hashedPassword, nombre_completo.trim(), correo.toLowerCase().trim(), DNI.trim(), curso || null, nivel_educativo || null]
        );

        // Obtener el ID del usuario recién insertado
        const ID_Usuario = usuarioResult.rows[0]?.id_usuario ?? usuarioResult.insertId;
        if (!ID_Usuario) {
          throw new Error('No se pudo obtener el ID del usuario creado.');
        }

        // 4. Obtener o crear ID del curso (si se proporcionó)
        let ID_Curso: number | null = null;
        if (curso && curso.trim()) {
          const cursoResult = await pool.query(
            `SELECT id_curso FROM curso WHERE LOWER(TRIM(nombre_curso)) = LOWER(TRIM(?))`,
            [curso.trim()]
          );
          if (cursoResult.rows.length > 0) {
            ID_Curso = cursoResult.rows[0].id_curso;
          } else {
            const insCurso = await pool.query(
              `INSERT INTO curso (nombre_curso, nivel_educativo) VALUES (?, ?)`,
              [curso.trim(), nivel_educativo || 'Secundario']
            );
            ID_Curso = insCurso.insertId;
          }
        }

        // 5. Separar nombre y apellido
        const partes = nombre_completo.trim().split(' ');
        const apellido = partes.slice(1).join(' ') || '';

        // 6. Insertar en tabla alumno
        await pool.query(
          `INSERT INTO alumno (DNI, nombre_completo, apellido, id_curso, id_usuario, correo, contrasena, nivel_educativo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [DNI.trim(), nombre_completo.trim(), apellido, ID_Curso, ID_Usuario, correo.toLowerCase().trim(), hashedPassword, nivel_educativo || null]
        );

        // 7. Registrar auditoría de registro
        try {
          await pool.query(
            `INSERT INTO auditoria_acceso (usuario_id, correo, evento, detalle) VALUES (?, ?, 'REGISTRO_ALUMNO', ?)`,
            [ID_Usuario, correo.toLowerCase().trim(), `Estado inicial: PENDIENTE_DE_ASIGNACION, Nivel: ${nivel_educativo || 'sin asignar'}, Curso: ${curso || 'sin asignar'}`]
          );
        } catch (_e) {}

        await pool.query('COMMIT');

        return res.status(201).json({ success: true, message: '¡Alumno registrado exitosamente! Tu cuenta está pendiente de asignación por el administrador.', id: ID_Usuario });
      } catch (txErr) {
        await pool.query('ROLLBACK');
        throw txErr;
      }
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
    const { nombre_completo, correo, materia, nivel_educativo, DNI, contrasena } = req.body;

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

      // Iniciar transacción para garantizar persistencia atómica
      await pool.query('BEGIN TRANSACTION');

      try {
        // 3. Insertar en usuarios
        const usuarioResult = await pool.query(
          `INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, nivel_educativo, rol, estado_acceso)
           VALUES (?, ?, ?, ?, ?, 'profesor', 'ACTIVO')`,
          [hashedPassword, nombre_completo.trim(), correo.toLowerCase().trim(), DNI.trim(), nivel_educativo || null]
        );

        // Obtener el ID del usuario recién insertado
        const ID_Usuario = usuarioResult.rows[0]?.id_usuario ?? usuarioResult.insertId;
        if (!ID_Usuario) {
          throw new Error('No se pudo obtener el ID del usuario creado.');
        }

        // 4. Insertar en tabla profesor
        await pool.query(
          `INSERT INTO profesor (id_usuario, correo, DNI, nombre_completo, materia, contrasena, nivel_educativo)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [ID_Usuario, correo.toLowerCase().trim(), DNI.trim(), nombre_completo.trim(), materia || '', hashedPassword, nivel_educativo || null]
        );

        // 5. Auditoría
        try {
          await pool.query(
            `INSERT INTO auditoria_acceso (usuario_id, correo, evento, detalle) VALUES (?, ?, 'REGISTRO_PROFESOR', ?)`,
            [ID_Usuario, correo.toLowerCase().trim(), `Profesor registrado (Materia: ${materia || 'General'}, Nivel: ${nivel_educativo || 'sin asignar'})`]
          );
        } catch (_e) {}

        await pool.query('COMMIT');

        return res.status(201).json({ success: true, message: '¡Profesor registrado exitosamente!', id: ID_Usuario });
      } catch (txErr) {
        await pool.query('ROLLBACK');
        throw txErr;
      }
    } catch (err: any) {
      console.error('Error en registro de profesor:', err);
      if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
      }
      return res.status(500).json({ error: 'Error interno del servidor al registrar el profesor.' });
    }
  }
);

// ── Registro de preceptor ─────────────────────────────────────
router.post(
  '/registro-preceptor',
  async (req: Request<{}, any, RegistroPreceptorBody>, res: Response) => {
    const { nombre_completo, correo, DNI, contrasena, nivel_educativo, turno } = req.body;

    if (!nombre_completo || !correo || !DNI || !contrasena) {
      return res.status(400).json({ error: 'Datos incompletos. Nombre, correo, DNI y contraseña son obligatorios.' });
    }

    if (String(contrasena).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
      // 1. Verificar si ya existe
      const verificarResult = await pool.query(
        `SELECT id_usuario FROM usuarios WHERE LOWER(correo) = ? OR DNI = ?`,
        [correo.toLowerCase().trim(), DNI.trim()]
      );
      if (verificarResult.rows.length > 0) {
        return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
      }

      // 2. Hashear contraseña
      const hashedPassword = await bcrypt.hash(contrasena, 10);

      // Iniciar transacción atómica
      await pool.query('BEGIN TRANSACTION');

      try {
        // 3. Insertar en usuarios con rol 'preceptor' y estado 'ACTIVO'
        const usuarioResult = await pool.query(
          `INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, nivel_educativo, rol, estado_acceso)
           VALUES (?, ?, ?, ?, ?, 'preceptor', 'ACTIVO')`,
          [hashedPassword, nombre_completo.trim(), correo.toLowerCase().trim(), DNI.trim(), nivel_educativo || 'Secundario']
        );

        const ID_Usuario = usuarioResult.rows?.[0]?.id_usuario ?? usuarioResult.insertId;

        // 4. Registrar auditoría de registro
        try {
          await pool.query(
            `INSERT INTO auditoria_acceso (usuario_id, correo, evento, detalle) VALUES (?, ?, 'REGISTRO_PRECEPTOR', ?)`,
            [ID_Usuario, correo.toLowerCase().trim(), `Preceptor registrado (Nivel: ${nivel_educativo || 'Secundario'}, Turno: ${turno || 'General'})`]
          );
        } catch (_e) {}

        await pool.query('COMMIT');

        return res.status(201).json({
          success: true,
          message: '¡Preceptor registrado exitosamente! Ya puedes iniciar sesión con tu cuenta.',
          id: ID_Usuario
        });
      } catch (txErr) {
        await pool.query('ROLLBACK');
        throw txErr;
      }
    } catch (err: any) {
      console.error('Error en registro de preceptor:', err);
      if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
      }
      return res.status(500).json({ error: 'Error interno del servidor al registrar el preceptor.' });
    }
  }
);

// ── Endpoint unificado /registro con protección estricta ──────
router.post('/registro', async (req: Request, res: Response) => {
  const rol = String(req.body.rol || 'alumno').toLowerCase().trim();
  if (rol === 'admin' || rol === 'administrador') {
    return res.status(403).json({ error: 'No está permitido el registro público con rol Administrador.' });
  }
  if (rol === 'profesor') {
    return (router as any).handle({ ...req, url: '/registro-profesor' }, res);
  }
  if (rol === 'preceptor') {
    return (router as any).handle({ ...req, url: '/registro-preceptor' }, res);
  }
  return (router as any).handle({ ...req, url: '/registro-alumno' }, res);
});

export default router;
