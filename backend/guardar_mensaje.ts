// archivo: routes/guardarMensaje.ts
import { Router, Request, Response } from 'express';
import conexion from './conexion_be';

const router = Router();

router.post('/guardar-mensaje', (req: Request, res: Response) => {
  const mensaje: string = typeof req.body.mensaje === 'string' ? req.body.mensaje : '';

  if (!mensaje || mensaje.trim() === '') {
    return res.status(400).send('Mensaje vacío');
  }

  const query = 'INSERT INTO tablon_mensajes (mensaje, fecha) VALUES (?, NOW())';

  conexion.query(query, [mensaje], (err: any) => {
    if (err) {
      console.error('❌ Error al guardar mensaje:', err);
      return res.status(500).send('Error al guardar el mensaje');
    }
    res.sendStatus(200); // OK
  });
});

export default router;
