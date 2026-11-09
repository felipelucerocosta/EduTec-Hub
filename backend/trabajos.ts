import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';
import { verificarAccesoClase } from './permisos';

const router = Router();

// Helper to check user session
const getUserId = (req: Request) => req.session?.usuario?.id;

// GET /api/clases/:claseId/trabajos - List assignments for a class (Checked permissions)
router.get('/clases/:claseId/trabajos', async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  // Verificar pertenencia a la clase
  const { permitido, motivo } = await verificarAccesoClase(usuario, claseId);
  if (!permitido) {
    return res.status(403).json({ error: motivo || 'No tienes permisos para ver los trabajos de esta clase.' });
  }

  try {
    const query = `
      SELECT t.*, u.nombre_completo as creador_nombre
      FROM trabajos t
      LEFT JOIN usuarios u ON t.creado_por = u.id_usuario
      WHERE t.clase_id = $1
      ORDER BY t.fecha_creacion DESC
    `;
    const result = await pool.query(query, [claseId]);
    
    // Also attach student submission status if requested by a student
    const isAlumno = usuario.rol === 'alumno';
    if (isAlumno && result.rows.length > 0) {
      // Check direct submissions
      const entregasQ = `
        SELECT trabajo_id, id as entrega_id, estado, calificacion, fecha_entrega, alumno_id as entregado_por_id
        FROM entregas
        WHERE alumno_id = $1
      `;
      const entregasRes = await pool.query(entregasQ, [usuario.id]);
      const entregasMap = new Map(entregasRes.rows.map((e: any) => [e.trabajo_id, e]));

      // Check group submissions where student is a member (but didn't submit)
      const grupalQ = `
        SELECT e.trabajo_id, e.id as entrega_id, e.estado, e.calificacion, e.fecha_entrega,
               e.alumno_id as entregado_por_id, u.nombre_completo as entregado_por_nombre
        FROM entrega_integrantes ei
        JOIN entregas e ON ei.entrega_id = e.id
        JOIN usuarios u ON e.alumno_id = u.id_usuario
        WHERE ei.usuario_id = $1 AND e.alumno_id != $1
      `;
      const grupalRes = await pool.query(grupalQ, [usuario.id]);
      const grupalMap = new Map(grupalRes.rows.map((e: any) => [e.trabajo_id, e]));

      const rowsWithStatus = result.rows.map((t: any) => {
        const entrega = entregasMap.get(t.id);
        const grupal = grupalMap.get(t.id);
        if (entrega) {
          const esGrupal = t.tipo_entrega === 'grupal';
          return {
            ...t,
            entrega: entrega || null,
            mi_estado: esGrupal ? 'entrega_grupal_enviada' : (entrega.estado || 'entregado')
          };
        } else if (grupal) {
          return {
            ...t,
            entrega: grupal,
            mi_estado: 'entregado_en_grupo',
            entregado_por_nombre: grupal.entregado_por_nombre
          };
        }
        return {
          ...t,
          entrega: null,
          mi_estado: 'sin_entregar'
        };
      });
      return res.json(rowsWithStatus);
    }

    return res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener trabajos:', error);
    return res.status(500).json({ error: 'Error al obtener trabajos' });
  }
});

// GET /api/trabajos/:id - Get detailed assignment info (Checked permissions)
router.get('/trabajos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  try {
    const query = `
      SELECT t.*, c.nombre as clase_nombre, c.id as clase_id, u.nombre_completo as creador_nombre
      FROM trabajos t
      JOIN clases c ON t.clase_id = c.id
      LEFT JOIN usuarios u ON t.creado_por = u.id_usuario
      WHERE t.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    const trabajo = result.rows[0];

    // Validar que el usuario pertenezca a la clase de este trabajo
    const { permitido, motivo } = await verificarAccesoClase(usuario, trabajo.clase_id);
    if (!permitido) {
      return res.status(403).json({ error: motivo || 'No tienes permisos para acceder a este trabajo.' });
    }

    // If student, attach their submission (direct or via group)
    if (usuario.rol === 'alumno') {
      const entregaQ = `SELECT * FROM entregas WHERE trabajo_id = $1 AND alumno_id = $2`;
      const entregaRes = await pool.query(entregaQ, [id, usuario.id]);

      if (entregaRes.rows.length > 0) {
        const entrega = entregaRes.rows[0];
        if (trabajo.tipo_entrega === 'grupal') {
          const membersQ = `
            SELECT ei.usuario_id, u.nombre_completo
            FROM entrega_integrantes ei
            JOIN usuarios u ON ei.usuario_id = u.id_usuario
            WHERE ei.entrega_id = $1
          `;
          const membersRes = await pool.query(membersQ, [entrega.id]);
          entrega.integrantes = membersRes.rows;
          entrega.tipo_participacion = 'enviada_por_mi';
        }
        trabajo.mi_entrega = entrega;
      } else {
        const grupalQ = `
          SELECT e.*, u.nombre_completo as entregado_por_nombre
          FROM entrega_integrantes ei
          JOIN entregas e ON ei.entrega_id = e.id
          JOIN usuarios u ON e.alumno_id = u.id_usuario
          WHERE ei.usuario_id = $1 AND e.trabajo_id = $2
        `;
        const grupalRes = await pool.query(grupalQ, [usuario.id, id]);
        if (grupalRes.rows.length > 0) {
          const entrega = grupalRes.rows[0];
          const membersQ = `
            SELECT ei.usuario_id, u.nombre_completo
            FROM entrega_integrantes ei
            JOIN usuarios u ON ei.usuario_id = u.id_usuario
            WHERE ei.entrega_id = $1
          `;
          const membersRes = await pool.query(membersQ, [entrega.id]);
          entrega.integrantes = membersRes.rows;
          entrega.tipo_participacion = 'incluido_en_grupo';
          trabajo.mi_entrega = entrega;
        } else {
          trabajo.mi_entrega = null;
        }
      }
    }

    return res.json(trabajo);
  } catch (error) {
    console.error('Error al obtener trabajo:', error);
    return res.status(500).json({ error: 'Error al obtener detalle del trabajo' });
  }
});

// POST /api/clases/:claseId/trabajos - Create new assignment (Teacher assigned to class / Admin)
router.post('/clases/:claseId/trabajos', async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  if (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin) {
    return res.status(403).json({ error: 'Solo los profesores o administradores pueden crear trabajos.' });
  }

  // Verificar que el profesor esté asignado a esta clase
  const { permitido, motivo } = await verificarAccesoClase(usuario, claseId);
  if (!permitido) {
    return res.status(403).json({ error: motivo || 'No tienes permisos para crear trabajos en esta clase.' });
  }

  const { titulo, descripcion, instrucciones, fecha_limite, puntos_max, tipo_entrega } = req.body;

  if (!titulo || !titulo.trim()) {
    return res.status(400).json({ error: 'El título del trabajo es obligatorio.' });
  }

  const tipoEntregaValido = tipo_entrega === 'grupal' ? 'grupal' : 'individual';

  try {
    const insertQ = `
      INSERT INTO trabajos (clase_id, titulo, descripcion, instrucciones, fecha_limite, puntos_max, tipo_entrega, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `;
    const result = await pool.query(insertQ, [
      claseId,
      titulo.trim(),
      descripcion ? descripcion.trim() : null,
      instrucciones ? instrucciones.trim() : null,
      fecha_limite || null,
      puntos_max || 10,
      tipoEntregaValido,
      usuario.id
    ]);

    const newTrabajoId = result.rows?.[0]?.id || result.insertId;

    // Notificar a los alumnos inscriptos
    const alumnosQ = `
      SELECT ac.alumno_id FROM alumnos_clases ac 
      JOIN clases c ON LOWER(TRIM(c.codigo)) = LOWER(TRIM(ac.codigo)) 
      WHERE c.id = $1
    `;
    const alumnosRes = await pool.query(alumnosQ, [claseId]);
    
    for (const alumno of alumnosRes.rows) {
      try {
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
           VALUES ($1, 'trabajo_nuevo', $2, $3, 'trabajo', $4)`,
          [alumno.alumno_id, `Nuevo trabajo: ${titulo}`, `Se ha publicado un nuevo trabajo en tu clase.`, newTrabajoId]
        );
      } catch (_e) {}
    }

    return res.status(201).json({ success: true, message: 'Trabajo publicado exitosamente', id: newTrabajoId });
  } catch (error) {
    console.error('Error al crear trabajo:', error);
    return res.status(500).json({ error: 'Error al crear trabajo' });
  }
});

// PUT /api/trabajos/:id - Edit assignment
router.put('/trabajos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  try {
    const trabajoQ = await pool.query('SELECT clase_id FROM trabajos WHERE id = $1', [id]);
    if (trabajoQ.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado.' });
    }

    const { permitido, motivo } = await verificarAccesoClase(usuario, trabajoQ.rows[0].clase_id);
    if (!permitido || (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin)) {
      return res.status(403).json({ error: motivo || 'No tienes permisos para editar este trabajo.' });
    }

    const { titulo, descripcion, instrucciones, fecha_limite, puntos_max, tipo_entrega } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'El título del trabajo es obligatorio.' });
    }

    const updateQ = `
      UPDATE trabajos
      SET titulo = $1,
          descripcion = $2,
          instrucciones = $3,
          fecha_limite = $4,
          puntos_max = $5,
          tipo_entrega = $6
      WHERE id = $7
    `;
    await pool.query(updateQ, [
      titulo.trim(),
      descripcion ? descripcion.trim() : null,
      instrucciones ? instrucciones.trim() : null,
      fecha_limite || null,
      puntos_max || 10,
      tipo_entrega === 'grupal' ? 'grupal' : 'individual',
      id
    ]);

    return res.json({ success: true, message: 'Trabajo actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar trabajo:', error);
    return res.status(500).json({ error: 'Error al actualizar trabajo' });
  }
});

// DELETE /api/trabajos/:id - Delete assignment
router.delete('/trabajos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  try {
    const trabajoQ = await pool.query('SELECT clase_id FROM trabajos WHERE id = $1', [id]);
    if (trabajoQ.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado.' });
    }

    const { permitido, motivo } = await verificarAccesoClase(usuario, trabajoQ.rows[0].clase_id);
    if (!permitido || (usuario.rol !== 'profesor' && usuario.rol !== 'admin' && !usuario.isAdmin)) {
      return res.status(403).json({ error: motivo || 'No tienes permisos para eliminar este trabajo.' });
    }

    await pool.query('DELETE FROM trabajos WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Trabajo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar trabajo:', error);
    return res.status(500).json({ error: 'Error al eliminar trabajo' });
  }
});

// GET /api/clases/:claseId/alumnos - Get students list
router.get('/clases/:claseId/alumnos', async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const usuario = req.session?.usuario;

  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
  }

  const { permitido, motivo } = await verificarAccesoClase(usuario, claseId);
  if (!permitido) {
    return res.status(403).json({ error: motivo || 'No tienes permisos para ver los alumnos de esta clase.' });
  }

  try {
    const claseQ = await pool.query('SELECT codigo FROM clases WHERE id = $1', [claseId]);
    if (claseQ.rows.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    const codigo = claseQ.rows[0].codigo;

    const alumnosQ = `
      SELECT 
        u.id_usuario as id, 
        u.nombre_completo as nombre, 
        u.nombre_completo, 
        u.correo, 
        u.DNI, 
        ac.fecha_union, 
        'Inscripto' as estado
      FROM alumnos_clases ac
      JOIN usuarios u ON ac.alumno_id = u.id_usuario
      WHERE LOWER(TRIM(ac.codigo)) = LOWER(TRIM($1))
      ORDER BY u.nombre_completo ASC
    `;
    const result = await pool.query(alumnosQ, [codigo]);
    return res.json(result.rows || []);
  } catch (error) {
    console.error('Error al obtener alumnos de la clase:', error);
    return res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

export default router;
