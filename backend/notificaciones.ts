import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();
const getUserId = (req: Request) => req.session?.usuario?.id;

// GET /api/notificaciones - Get notifications for logged in user
router.get('/notificaciones', async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const query = `
      SELECT * FROM notificaciones 
      WHERE usuario_id = $1 
      ORDER BY fecha DESC 
      LIMIT 50
    `;
    const result = await pool.query(query, [userId]);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// PUT /api/notificaciones/:id/leer - Mark single notification as read
router.put('/notificaciones/:id/leer', async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    await pool.query('UPDATE notificaciones SET leida = 1 WHERE id = $1 AND usuario_id = $2', [id, userId]);
    return res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// PUT /api/notificaciones/leer-todas - Mark all notifications as read
router.put('/notificaciones/leer-todas', async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    await pool.query('UPDATE notificaciones SET leida = 1 WHERE usuario_id = $1', [userId]);
    return res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
