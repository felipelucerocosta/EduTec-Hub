// backend/guardar_mensaje.ts (CORREGIDO)
import { Router, Request, Response } from 'express';
import pool from './conexion_be'; // Importa el pool de PostgreSQL

const router = Router();

router.post('/guardar-mensaje', async (req: Request, res: Response) => {
  const mensaje: string = typeof req.body.mensaje === 'string' ? req.body.mensaje : '';

  if (!mensaje || mensaje.trim() === '') {
    return res.status(400).send('Mensaje vacío');
  }

  // Sintaxis de PostgreSQL: usa $1 en lugar de ?
  const query = 'INSERT INTO tablon_mensajes (mensaje, fecha) VALUES ($1, NOW())';

  try {
    // Sintaxis de PostgreSQL: usa async/await (no callbacks)
    await pool.query(query, [mensaje]);
    res.sendStatus(200); // OK
  } catch (err) {
    console.error('❌ Error al guardar mensaje:', err);
    res.status(500).send('Error al guardar el mensaje');
  }
});

export default router;