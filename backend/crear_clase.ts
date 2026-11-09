import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();

// Crear clase (con 0 profesores y 0 alumnos asignados por defecto)
router.post('/crear-clase', async (req: Request, res: Response) => {
  const nombre: string = String(req.body.nombre || '').trim();
  const seccion: string = String(req.body.seccion || '').trim();
  const materia: string = String(req.body.materia || '').trim();
  const aula: string = String(req.body.aula || '').trim();
  const titular_id = req.body.titular_id ? Number(req.body.titular_id) : null;

  if (!nombre || !materia) {
    return res.status(400).json({ error: 'Datos incompletos: nombre y materia son obligatorios.' });
  }

  // Solo los administradores pueden crear clases
  const rol = req.session?.usuario?.rol;
  if (!req.session?.usuario || (rol !== 'admin' && !req.session?.usuario?.isAdmin)) {
    return res.status(403).json({ error: 'Solo los administradores pueden crear clases.' });
  }

  const creador_id = req.session?.usuario?.id ?? null;
  let titular_nombre = 'Sin Asignar';

  if (titular_id) {
    const profQ = await pool.query('SELECT nombre_completo FROM usuarios WHERE id_usuario = $1', [titular_id]);
    if (profQ.rows.length > 0) {
      titular_nombre = profQ.rows[0].nombre_completo;
    }
  }

  // Generar código único simple
  const codigo = (materia.substring(0, 3) || 'XXX').toUpperCase() + Math.floor(1000 + Math.random() * 9000);

  try {
    // Verificar duplicado por nombre+seccion+materia
    const verificar = await pool.query(
      'SELECT id FROM clases WHERE LOWER(nombre) = LOWER($1) AND LOWER(seccion) = LOWER($2) AND LOWER(materia) = LOWER($3) LIMIT 1',
      [nombre, seccion, materia]
    );

    if (verificar.rows && verificar.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe una clase con ese nombre, materia y división/sección.' });
    }

    const insertResult = await pool.query(
      `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [nombre, seccion, materia, aula, titular_nombre, creador_id, titular_id, codigo]
    );

    const nuevaClaseId = insertResult.rows?.[0]?.id;

    // Si se asignó un docente inicial, registrar en profesores_clases
    if (titular_id && nuevaClaseId) {
      try {
        await pool.query(
          'INSERT INTO profesores_clases (profesor_id, clase_id) VALUES ($1, $2)',
          [titular_id, nuevaClaseId]
        );
      } catch (_e) {}
    }

    const nuevaClase = {
      id: nuevaClaseId,
      nombre, 
      seccion, 
      materia, 
      aula, 
      creador: titular_nombre,
      titular_id,
      codigo,
      cantidad_alumnos: 0,
      total_trabajos: 0
    };

    res.status(201).json({ 
      success: true, 
      message: 'Clase creada exitosamente con 0 alumnos.', 
      clase: nuevaClase 
    });

  } catch (error) {
    console.error('Error al crear la clase:', error);
    res.status(500).json({ error: 'Error al crear la clase' });
  }
});

export default router;
