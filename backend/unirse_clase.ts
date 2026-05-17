import { Router, type Request, type Response } from 'express';
import 'express-session';
import pool from './conexion_pg'; // 👈 1. Importa el POOL de PostgreSQL

declare module 'express-session' {
  interface SessionData {
    alumno_id?: number;
  }
}

const router = Router();

router.post('/unirse-clase', async (req: Request, res: Response) => { // 👈 2. Convertido a async
  
  // Usamos el ID de la sesión (más seguro)
  const alumno_id = req.session?.usuario?.id;
  if (!alumno_id) {
    return res.status(401).send('Debes iniciar sesión como alumno.');
  }

  const materia: string = req.body.materia || '';
  const codigo: string = req.body.codigo || '';

  if (!materia || !codigo) {
    return res.status(400).send('Datos incompletos.');
  }

  try {
    // 👈 3. Query de PostgreSQL (usa $1, $2)
    // Verificar si ya está unido a la clase
    const verificarSql = `
      SELECT * FROM alumnos_clases 
      WHERE alumno_id = $1 AND materia = $2
    `;
    const resultVerificar = await pool.query(verificarSql, [alumno_id, materia]);

    if (resultVerificar.rows.length > 0) {
      return res.send(`Ya estás unido a la clase de ${materia}.`);
    }

    // Insertar la relación
    const insertSql = `
      INSERT INTO alumnos_clases (alumno_id, materia, codigo) 
      VALUES ($1, $2, $3)
    `;
    
    // 👈 4. Usa pool.query con await (sin callbacks)
    await pool.query(insertSql, [alumno_id, materia, codigo]);
    
    res.send('Te has unido a la clase exitosamente.');

  } catch (err) {
    console.error('Error en la base de datos (unirse_clase):', err);
    res.status(500).send('Error en la base de datos.');
  }
});

export default router;