import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';
import * as bcrypt from 'bcrypt';

const router = Router();

// Middleware: solo administradores
function requireAdmin(req: Request, res: Response, next: Function) {
  const usuario = req.session?.usuario;
  if (!usuario || usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
}

// ─── GET /api/admin/stats ──────────────────────────────────────────────────
// Dashboard KPIs: totales de alumnos, profesores, clases, trabajos, entregas pendientes
router.get('/admin/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [alumnos, profesores, clases, trabajos, entregasPend] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total FROM usuarios WHERE rol = 'alumno'`),
      pool.query(`SELECT COUNT(*) as total FROM usuarios WHERE rol = 'profesor'`),
      pool.query(`SELECT COUNT(*) as total FROM clases`),
      pool.query(`SELECT COUNT(*) as total FROM trabajos`),
      pool.query(`SELECT COUNT(*) as total FROM entregas WHERE estado != 'corregido'`),
    ]);

    return res.json({
      total_alumnos:   Number(alumnos.rows[0]?.total  || 0),
      total_profesores: Number(profesores.rows[0]?.total || 0),
      total_clases:    Number(clases.rows[0]?.total   || 0),
      total_trabajos:  Number(trabajos.rows[0]?.total  || 0),
      entregas_pendientes: Number(entregasPend.rows[0]?.total || 0),
    });
  } catch (error) {
    console.error('Error en admin/stats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
});

// ─── GET /api/admin/usuarios ───────────────────────────────────────────────
// Lista todos los usuarios con su rol y estado de acceso
router.get('/admin/usuarios', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { rol } = req.query;
    let query = `
      SELECT id_usuario, nombre_completo, correo, rol, DNI, curso, fecha_registro, estado_acceso
      FROM usuarios
    `;
    const params: any[] = [];
    if (rol && ['alumno', 'profesor', 'admin'].includes(String(rol))) {
      query += ` WHERE rol = $1`;
      params.push(rol);
    }
    query += ` ORDER BY rol ASC, nombre_completo ASC`;
    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en admin/usuarios:', error);
    return res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

// ─── GET /api/admin/alumnos/pendientes ────────────────────────────────────
// Lista alumnos con estado PENDIENTE_DE_ASIGNACION
router.get('/admin/alumnos/pendientes', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id_usuario, nombre_completo, correo, DNI, curso, fecha_registro, estado_acceso
      FROM usuarios
      WHERE rol = 'alumno' AND (estado_acceso = 'PENDIENTE_DE_ASIGNACION' OR estado_acceso IS NULL)
      ORDER BY fecha_registro DESC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en admin/alumnos/pendientes:', error);
    return res.status(500).json({ error: 'Error al obtener alumnos pendientes.' });
  }
});

// ─── PATCH /api/admin/usuarios/:id/estado ─────────────────────────────────
// Cambiar el estado_acceso de un usuario (ACTIVO / PENDIENTE_DE_ASIGNACION / SUSPENDIDO)
router.patch('/admin/usuarios/:id/estado', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado_acceso } = req.body;
  const adminId = req.session?.usuario?.id;

  const estadosValidos = ['ACTIVO', 'PENDIENTE_DE_ASIGNACION', 'SUSPENDIDO'];
  if (!estadosValidos.includes(estado_acceso)) {
    return res.status(400).json({ error: `Estado inválido. Use: ${estadosValidos.join(', ')}` });
  }

  try {
    const userQ = await pool.query('SELECT nombre_completo, correo, rol FROM usuarios WHERE id_usuario = $1', [id]);
    if (userQ.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    await pool.query('UPDATE usuarios SET estado_acceso = $1 WHERE id_usuario = $2', [estado_acceso, id]);

    // Registrar en auditoría
    try {
      await pool.query(
        `INSERT INTO auditoria_acceso (usuario_id, correo, evento, detalle) VALUES ($1, $2, 'CAMBIO_ESTADO', $3)`,
        [id, userQ.rows[0].correo, `Admin ${adminId} cambió estado a: ${estado_acceso}`]
      );
    } catch (_e) {}

    const nombreEstado = estado_acceso === 'ACTIVO' ? 'ACTIVADO' : estado_acceso === 'SUSPENDIDO' ? 'SUSPENDIDO' : 'PUESTO EN PENDIENTE';
    return res.json({
      success: true,
      message: `Usuario "${userQ.rows[0].nombre_completo}" ${nombreEstado} correctamente.`
    });
  } catch (error) {
    console.error('Error cambiando estado de usuario:', error);
    return res.status(500).json({ error: 'Error al cambiar el estado del usuario.' });
  }
});

// ─── GET /api/admin/auditoria ─────────────────────────────────────────────
// Ver registro de auditoría de acceso
router.get('/admin/auditoria', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const result = await pool.query(
      `SELECT * FROM auditoria_acceso ORDER BY fecha DESC LIMIT $1`,
      [limit]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en admin/auditoria:', error);
    return res.status(500).json({ error: 'Error al obtener auditoría.' });
  }
});



// ─── DELETE /api/admin/usuarios/:id ───────────────────────────────────────
// Eliminar usuario (con protección para no auto-eliminarse)
router.delete('/admin/usuarios/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const myId = req.session?.usuario?.id;

  if (Number(id) === myId) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
  }

  try {
    await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
    return res.json({ success: true, message: 'Usuario eliminado.' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
});

// ─── GET /api/admin/clases ─────────────────────────────────────────────────
// Lista todas las clases con titular y cantidad de alumnos
router.get('/admin/clases', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.seccion,
        c.materia,
        c.aula,
        c.codigo,
        c.creador,
        c.titular_id,
        u.nombre_completo as titular_nombre,
        u.correo as titular_correo,
        (SELECT COUNT(*) FROM alumnos_clases ac WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))) AS cantidad_alumnos,
        (SELECT COUNT(*) FROM trabajos t WHERE t.clase_id = c.id) AS total_trabajos
      FROM clases c
      LEFT JOIN usuarios u ON c.titular_id = u.id_usuario
      ORDER BY c.id DESC
    `;
    const result = await pool.query(query, []);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en admin/clases:', error);
    return res.status(500).json({ error: 'Error al obtener clases.' });
  }
});

// ─── POST /api/admin/clases ────────────────────────────────────────────────
// Crear clase con asignación de titular opcional
router.post('/admin/clases', requireAdmin, async (req: Request, res: Response) => {
  const { nombre, seccion, materia, aula, titular_id } = req.body;

  if (!nombre || !materia) {
    return res.status(400).json({ error: 'Nombre y materia son obligatorios.' });
  }

  // Verificar duplicado
  const dup = await pool.query(
    'SELECT id FROM clases WHERE nombre = $1 AND materia = $2 AND seccion = $3 LIMIT 1',
    [nombre.trim(), materia.trim(), seccion || '']
  );
  if (dup.rows.length > 0) {
    return res.status(409).json({ error: 'Ya existe una clase con ese nombre, materia y sección.' });
  }

  const codigo = (materia.substring(0, 3) || 'XXX').toUpperCase() + Math.floor(1000 + Math.random() * 9000);
  const adminId = req.session?.usuario?.id;
  const adminNombre = req.session?.usuario?.nombre || 'Admin';

  // Si hay titular, obtener su nombre
  let titularNombre = 'Sin Asignar';
  if (titular_id) {
    const titQ = await pool.query('SELECT nombre_completo FROM usuarios WHERE id_usuario = $1', [titular_id]);
    if (titQ.rows.length > 0) titularNombre = titQ.rows[0].nombre_completo;
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [nombre.trim(), seccion || '', materia.trim(), aula || '', titularNombre, adminId, titular_id || null, codigo]
    );
    const newId = insertRes.rows?.[0]?.id;

    if (titular_id && newId) {
      try {
        await pool.query(
          'INSERT INTO profesores_clases (profesor_id, clase_id) VALUES ($1, $2)',
          [titular_id, newId]
        );
      } catch (_e) {}
    }

    return res.status(201).json({ success: true, message: 'Clase creada exitosamente con 0 alumnos.', codigo, id: newId });
  } catch (error) {
    console.error('Error al crear clase (admin):', error);
    return res.status(500).json({ error: 'Error al crear la clase.' });
  }
});

// ─── DELETE /api/admin/clases/:id ─────────────────────────────────────────
// Eliminar clase
router.delete('/admin/clases/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM clases WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Clase eliminada.' });
  } catch (error) {
    console.error('Error eliminando clase:', error);
    return res.status(500).json({ error: 'Error al eliminar la clase.' });
  }
});

// ─── POST /api/admin/clases/:id/asignar-profesor ──────────────────────────
// Asigna o cambia el titular de una clase
router.post('/admin/clases/:id/asignar-profesor', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { profesor_id } = req.body;

  if (!profesor_id) {
    return res.status(400).json({ error: 'Se requiere el ID del profesor.' });
  }

  try {
    // Verificar que el profesor exista y tenga el rol correcto
    const profQ = await pool.query(
      `SELECT id_usuario, nombre_completo FROM usuarios WHERE id_usuario = $1 AND (rol = 'profesor' OR rol = 'admin')`,
      [profesor_id]
    );
    if (profQ.rows.length === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado.' });
    }

    const { nombre_completo } = profQ.rows[0];
    await pool.query(
      `UPDATE clases SET titular_id = $1, creador = $2 WHERE id = $3`,
      [profesor_id, nombre_completo, id]
    );

    // Sincronizar en tabla profesores_clases
    try {
      await pool.query('DELETE FROM profesores_clases WHERE clase_id = $1', [id]);
      await pool.query(
        'INSERT INTO profesores_clases (profesor_id, clase_id) VALUES ($1, $2)',
        [profesor_id, id]
      );
    } catch (_e) {}

    return res.json({ success: true, message: `Profesor "${nombre_completo}" asignado correctamente a la clase.` });
  } catch (error) {
    console.error('Error asignando profesor:', error);
    return res.status(500).json({ error: 'Error al asignar el profesor.' });
  }
});

// ─── DELETE /api/admin/clases/:id/asignar-profesor ────────────────────────
// Remover titular de una clase
router.delete('/admin/clases/:id/asignar-profesor', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE clases SET titular_id = NULL, creador = 'Sin Asignar' WHERE id = $1`, [id]);
    try {
      await pool.query('DELETE FROM profesores_clases WHERE clase_id = $1', [id]);
    } catch (_e) {}
    return res.json({ success: true, message: 'Titular removido de la clase.' });
  } catch (error) {
    console.error('Error removiendo titular:', error);
    return res.status(500).json({ error: 'Error al remover titular.' });
  }
});

// ─── GET /api/admin/clases/:id/alumnos ────────────────────────────────────
// Lista alumnos inscriptos en una clase específica
router.get('/admin/clases/:id/alumnos', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const claseQ = await pool.query('SELECT codigo FROM clases WHERE id = $1', [id]);
    if (claseQ.rows.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada.' });
    }
    const codigo = claseQ.rows[0].codigo;

    const query = `
      SELECT 
        u.id_usuario as id,
        u.nombre_completo as nombre,
        u.correo,
        u.DNI,
        ac.fecha_union
      FROM alumnos_clases ac
      JOIN usuarios u ON ac.alumno_id = u.id_usuario
      WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM($1))
      ORDER BY u.nombre_completo ASC
    `;
    const result = await pool.query(query, [codigo]);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo alumnos de clase:', error);
    return res.status(500).json({ error: 'Error al obtener alumnos.' });
  }
});

// ─── POST /api/admin/clases/:id/asignar-alumno ────────────────────────────
// Inscribir alumno en una clase
router.post('/admin/clases/:id/asignar-alumno', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { alumno_id } = req.body;

  if (!alumno_id) {
    return res.status(400).json({ error: 'Se requiere el ID del alumno.' });
  }

  try {
    // Obtener código de la clase
    const claseQ = await pool.query('SELECT codigo, materia FROM clases WHERE id = $1', [id]);
    if (claseQ.rows.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada.' });
    }
    const { codigo, materia } = claseQ.rows[0];

    // Verificar que el alumno exista
    const alumQ = await pool.query(
      `SELECT id_usuario, nombre_completo FROM usuarios WHERE id_usuario = $1 AND rol = 'alumno'`,
      [alumno_id]
    );
    if (alumQ.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado.' });
    }

    // Verificar que no esté ya inscripto
    const yaInscripto = await pool.query(
      `SELECT id FROM alumnos_clases WHERE alumno_id = $1 AND LOWER(TRIM(codigo)) = LOWER(TRIM($2))`,
      [alumno_id, codigo]
    );
    if (yaInscripto.rows.length > 0) {
      return res.status(409).json({ error: 'El alumno ya está inscripto en esta clase.' });
    }

    await pool.query(
      `INSERT INTO alumnos_clases (alumno_id, materia, codigo) VALUES ($1, $2, $3)`,
      [alumno_id, materia, codigo]
    );

    return res.json({ success: true, message: `Alumno "${alumQ.rows[0].nombre_completo}" inscripto correctamente.` });
  } catch (error) {
    console.error('Error inscribiendo alumno:', error);
    return res.status(500).json({ error: 'Error al inscribir al alumno.' });
  }
});

// ─── DELETE /api/admin/clases/:id/alumnos/:alumnoId ───────────────────────
// Desinscribir alumno de una clase
router.delete('/admin/clases/:id/alumnos/:alumnoId', requireAdmin, async (req: Request, res: Response) => {
  const { id, alumnoId } = req.params;
  try {
    const claseQ = await pool.query('SELECT codigo FROM clases WHERE id = $1', [id]);
    if (claseQ.rows.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada.' });
    }
    const codigo = claseQ.rows[0].codigo;

    await pool.query(
      `DELETE FROM alumnos_clases WHERE alumno_id = $1 AND LOWER(TRIM(codigo)) = LOWER(TRIM($2))`,
      [alumnoId, codigo]
    );
    return res.json({ success: true, message: 'Alumno desinscripto correctamente.' });
  } catch (error) {
    console.error('Error desinscribiendo alumno:', error);
    return res.status(500).json({ error: 'Error al desinscribir al alumno.' });
  }
});

// ─── GET /api/admin/profesores ─────────────────────────────────────────────
// Lista profesores con clases asignadas
router.get('/admin/profesores', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        u.id_usuario as id,
        u.nombre_completo as nombre,
        u.correo,
        u.DNI,
        p.materia,
        (SELECT COUNT(*) FROM clases c WHERE c.titular_id = u.id_usuario) as clases_asignadas
      FROM usuarios u
      LEFT JOIN profesor p ON p.id_usuario = u.id_usuario
      WHERE u.rol = 'profesor'
      ORDER BY u.nombre_completo ASC
    `;
    const result = await pool.query(query, []);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en admin/profesores:', error);
    return res.status(500).json({ error: 'Error al obtener profesores.' });
  }
});

// ─── GET /api/admin/alumnos ────────────────────────────────────────────────
// Lista alumnos con su curso
router.get('/admin/alumnos', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        u.id_usuario as id,
        u.nombre_completo as nombre,
        u.correo,
        u.DNI,
        u.curso,
        (SELECT COUNT(*) FROM alumnos_clases ac WHERE ac.alumno_id = u.id_usuario) as clases_inscriptas
      FROM usuarios u
      WHERE u.rol = 'alumno'
      ORDER BY u.nombre_completo ASC
    `;
    const result = await pool.query(query, []);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en admin/alumnos:', error);
    return res.status(500).json({ error: 'Error al obtener alumnos.' });
  }
});

// ─── POST /api/admin/usuarios ──────────────────────────────────────────────
// Crear usuario rápido desde el panel admin
router.post('/admin/usuarios', requireAdmin, async (req: Request, res: Response) => {
  const { nombre_completo, correo, contrasena, rol, DNI, curso, materia, estado_acceso } = req.body;

  if (!nombre_completo || !correo || !contrasena || !rol || !DNI) {
    return res.status(400).json({ error: 'Nombre, correo, contraseña, rol y DNI son obligatorios.' });
  }

  const rolesValidos = ['alumno', 'profesor', 'admin'];
  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido.' });
  }

  const estadoFinal = estado_acceso || 'ACTIVO';

  try {
    const dup = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE correo = $1 OR DNI = $2',
      [correo.toLowerCase().trim(), DNI.trim()]
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const insertRes = await pool.query(
      `INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, DNI, curso, estado_acceso)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_usuario`,
      [nombre_completo.trim(), correo.toLowerCase().trim(), hash, rol, DNI.trim(), curso || null, estadoFinal]
    );

    const userId = insertRes.rows[0]?.id_usuario || insertRes.insertId;

    // Insertar en tabla complementaria según rol
    if (rol === 'alumno') {
      await pool.query(
        `INSERT INTO alumno (DNI, nombre_completo, apellido, id_usuario, correo, contrasena)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [DNI.trim(), nombre_completo.trim(), '', userId, correo.toLowerCase().trim(), hash]
      );
    } else if (rol === 'profesor') {
      await pool.query(
        `INSERT INTO profesor (id_usuario, correo, DNI, nombre_completo, materia, contrasena)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, correo.toLowerCase().trim(), DNI.trim(), nombre_completo.trim(), materia || '', hash]
      );
    }

    // Registrar en auditoría
    try {
      await pool.query(
        `INSERT INTO auditoria_acceso (usuario_id, correo, evento, detalle) VALUES ($1, $2, 'CREACION_USUARIO', $3)`,
        [userId, correo.toLowerCase().trim(), `Creado por Admin (Rol: ${rol}, Estado: ${estadoFinal})`]
      );
    } catch (_e) {}

    return res.status(201).json({ success: true, message: 'Usuario creado exitosamente.', id: userId });
  } catch (error: any) {
    console.error('Error creando usuario (admin):', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'El correo o DNI ya están registrados.' });
    }
    return res.status(500).json({ error: 'Error al crear el usuario.' });
  }
});

// ─── PUT /api/admin/usuarios/:id ───────────────────────────────────────────
// Editar usuario existente
router.put('/admin/usuarios/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre_completo, correo, rol, DNI, curso, estado_acceso, contrasena } = req.body;

  if (!nombre_completo || !correo || !DNI || !rol) {
    return res.status(400).json({ error: 'Nombre, correo, DNI y rol son obligatorios.' });
  }

  try {
    const userQ = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id]);
    if (userQ.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Verificar duplicados en otros usuarios
    const dup = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE (correo = $1 OR DNI = $2) AND id_usuario != $3',
      [correo.toLowerCase().trim(), DNI.trim(), id]
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'El correo o DNI ya pertenecen a otro usuario.' });
    }

    if (contrasena && contrasena.trim().length >= 6) {
      const hash = await bcrypt.hash(contrasena.trim(), 10);
      await pool.query(
        `UPDATE usuarios SET nombre_completo = $1, correo = $2, rol = $3, DNI = $4, curso = $5, estado_acceso = $6, contrasena = $7 WHERE id_usuario = $8`,
        [nombre_completo.trim(), correo.toLowerCase().trim(), rol, DNI.trim(), curso || null, estado_acceso || 'ACTIVO', hash, id]
      );
    } else {
      await pool.query(
        `UPDATE usuarios SET nombre_completo = $1, correo = $2, rol = $3, DNI = $4, curso = $5, estado_acceso = $6 WHERE id_usuario = $7`,
        [nombre_completo.trim(), correo.toLowerCase().trim(), rol, DNI.trim(), curso || null, estado_acceso || 'ACTIVO', id]
      );
    }

    // Actualizar tabla alumno / profesor si corresponde
    if (rol === 'alumno') {
      await pool.query(
        `UPDATE alumno SET nombre_completo = $1, correo = $2, DNI = $3 WHERE id_usuario = $4`,
        [nombre_completo.trim(), correo.toLowerCase().trim(), DNI.trim(), id]
      );
    } else if (rol === 'profesor') {
      await pool.query(
        `UPDATE profesor SET nombre_completo = $1, correo = $2, DNI = $3 WHERE id_usuario = $4`,
        [nombre_completo.trim(), correo.toLowerCase().trim(), DNI.trim(), id]
      );
    }

    return res.json({ success: true, message: 'Usuario actualizado correctamente.' });
  } catch (error: any) {
    console.error('Error editando usuario (admin):', error);
    return res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
});

export default router;

