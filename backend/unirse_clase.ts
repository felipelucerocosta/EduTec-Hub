import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();

router.post('/unirse-clase', async (req: Request, res: Response) => {
  const alumno_id = req.session?.usuario?.id;
  if (!alumno_id) {
    return res.status(401).send('Debes iniciar sesión como alumno.');
  }

  // Verificar estado de acceso del alumno
  try {
    const estadoQ: any = await pool.query(
      'SELECT estado_acceso FROM usuarios WHERE id_usuario = $1',
      [alumno_id]
    );
    const estado = estadoQ.rows[0]?.estado_acceso || 'PENDIENTE_DE_ASIGNACION';
    if (estado !== 'ACTIVO') {
      return res.status(403).send(
        'Aún no tienes clases asignadas a tu perfil. Cuando el Administrador te asigne un curso o comisión, aparecerán automáticamente en tu panel.'
      );
    }
  } catch (_e) {}

  const codigo: string = String(req.body.codigo || '').trim();

  if (!codigo) {
    return res.status(400).send('El código de la clase es obligatorio.');
  }

  try {
    // 1. Buscar la clase por código
    const claseQ = await pool.query(
      `SELECT * FROM clases WHERE LOWER(TRIM(codigo)) = LOWER(TRIM($1)) LIMIT 1`,
      [codigo]
    );

    if (!claseQ.rows || claseQ.rows.length === 0) {
      return res.status(404).send('No se encontró ninguna clase con ese código. Verifica el código provisto por tu docente.');
    }

    const clase = claseQ.rows[0];

    // 2. Verificar si ya está unido
    const verificarSql = `
      SELECT * FROM alumnos_clases 
      WHERE alumno_id = $1 AND LOWER(TRIM(codigo)) = LOWER(TRIM($2))
    `;
    const resultVerificar = await pool.query(verificarSql, [alumno_id, clase.codigo]);

    if (resultVerificar.rows && resultVerificar.rows.length > 0) {
      return res.status(400).send(`Ya estás inscripto en la clase "${clase.nombre}".`);
    }

    // 3. Insertar relación
    const insertSql = `
      INSERT INTO alumnos_clases (alumno_id, materia, codigo) 
      VALUES ($1, $2, $3)
    `;
    await pool.query(insertSql, [alumno_id, clase.materia, clase.codigo]);
    
    return res.status(200).send('Te has unido a la clase exitosamente.');

  } catch (err) {
    console.error('Error en la base de datos (unirse_clase):', err);
    return res.status(500).send('Error interno al unirse a la clase.');
  }
});

export default router;