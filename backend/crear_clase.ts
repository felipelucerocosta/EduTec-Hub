import { Router, type Request, type Response } from 'express';
import 'express-session';
import pool from './conexion_be';

declare module 'express-session' {
  interface SessionData {
    nombre_completo?: string;
    usuario?: { 
      id: number;
      rol?: string;
      [key: string]: any;
    };
  }
}

const router = Router();

// Crear clase (con prevención de duplicados y titular)
router.post('/crear-clase', async (req: Request, res: Response) => {
  const nombre: string = String(req.body.nombre || '').trim();
  const seccion: string = String(req.body.seccion || '').trim();
  const materia: string = String(req.body.materia || '').trim();
  const aula: string = String(req.body.aula || '').trim();

  if (!nombre || !materia) {
    return res.status(400).json({ error: 'Datos incompletos: nombre y materia son obligatorios.' });
  }

  // Usar id de sesión si existe (profesor creador)
  const creador_id = req.session?.usuario?.id ?? null;
  const creador_nombre = (req.session as any)?.usuario?.nombre || req.session?.nombre_completo || 'Anónimo';

  // Generar código único simple
  const codigo = (materia.substring(0, 3) || 'XXX').toUpperCase() + Math.floor(1000 + Math.random() * 9000);

  try {
    // NOTA: La creación de tabla se maneja en setup_db.ts ahora.

    // Verificar duplicado por nombre+seccion+materia
    const verificar = await pool.query(
      'SELECT id FROM clases WHERE nombre = $1 AND seccion = $2 AND materia = $3 LIMIT 1',
      [nombre, seccion, materia]
    );

    if (verificar.rows && verificar.rows.length > 0) {
      return res.status(409).json({ error: 'La clase ya existe.' });
    }

    // 👇 INSERT CORREGIDO PARA SQLITE (Sin RETURNING *)
    await pool.query(
      `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, // Quitamos RETURNING *
      [nombre, seccion, materia, aula, creador_nombre, creador_id, creador_id, codigo]
    );

    // Como SQLite no devuelve los datos insertados, construimos la respuesta manualmente
    const nuevaClase = {
        nombre, 
        seccion, 
        materia, 
        aula, 
        creador: creador_nombre, 
        codigo
    };

    // Éxito
    res.json({ 
      success: true, 
      message: 'Clase creada exitosamente.', 
      clase: nuevaClase 
    });

  } catch (error) {
    console.error('Error al crear la clase:', error);
    res.status(500).json({ error: 'Error al crear la clase' });
  }
});

export default router;
