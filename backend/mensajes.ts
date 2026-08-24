import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();

function getIo() {
  try {
    const serverModule = require('./server');
    return serverModule.io;
  } catch (err) {
    return null;
  }
}

// POST /api/guardar-mensaje - Post message to forum (supports class-specific or global)
router.post('/guardar-mensaje', async (req: Request, res: Response) => {
  const { mensaje, clase_id } = req.body as { mensaje?: string; clase_id?: number };

  if (!mensaje || mensaje.trim() === '') {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  }

  const userId = req.session?.usuario?.id || null;
  const userNombre = req.session?.usuario?.nombre || 'Usuario';
  const userRol = req.session?.usuario?.rol || 'alumno';

  try {
    if (clase_id) {
      // Save as class announcement
      const insertRes = await pool.query(
        'INSERT INTO anuncios (clase_id, autor_id, contenido) VALUES ($1, $2, $3) RETURNING id',
        [clase_id, userId || 1, mensaje.trim()]
      );
      const insertedId = insertRes.insertId || (insertRes.rows && insertRes.rows[0]?.id) || Date.now();
      
      const nuevoMensaje = {
        id: insertedId,
        mensaje: mensaje.trim(),
        fecha: new Date().toISOString(),
        usuario: userNombre,
        usuario_id: userId,
        rol: userRol,
        clase_id: Number(clase_id)
      };

      const io = getIo();
      if (io) {
        io.emit('nuevo_mensaje', nuevoMensaje);
      }

      return res.status(201).json({ success: true, message: 'Mensaje publicado', nuevoMensaje });
    } else {
      // Save to global forum
      const cleanMensaje = mensaje.trim();
      const insertRes = await pool.query(
        'INSERT INTO tablon_mensajes (mensaje, usuario_id, usuario_nombre) VALUES ($1, $2, $3) RETURNING id',
        [cleanMensaje, userId, userNombre]
      );
      const insertedId = insertRes.insertId || (insertRes.rows && insertRes.rows[0]?.id) || Date.now();

      const nuevoMensaje = {
        id: insertedId,
        mensaje: cleanMensaje,
        fecha: new Date().toISOString(),
        usuario: userNombre,
        usuario_id: userId,
        rol: userRol
      };

      const io = getIo();
      if (io) {
        io.emit('nuevo_mensaje', nuevoMensaje);
      }

      return res.status(201).json({ success: true, message: 'Mensaje publicado', nuevoMensaje });
    }
  } catch (err) {
    console.error('❌ Error al guardar mensaje:', err);
    return res.status(500).json({ error: 'Error al guardar el mensaje' });
  }
});

// GET /api/mensajes - List forum messages as JSON
router.get('/mensajes', async (req: Request, res: Response) => {
  const clase_id = req.query.clase_id;

  try {
    if (clase_id) {
      const query = `
        SELECT a.id, a.contenido as mensaje, a.fecha, 
               COALESCE(u.nombre_completo, 'Usuario') as usuario, 
               a.autor_id as usuario_id,
               COALESCE(u.rol, 'profesor') as rol
        FROM anuncios a
        LEFT JOIN usuarios u ON a.autor_id = u.id_usuario
        WHERE a.clase_id = $1
        ORDER BY a.fecha DESC
        LIMIT 50
      `;
      const result = await pool.query(query, [clase_id]);
      return res.json(result.rows || []);
    } else {
      const query = `
        SELECT tm.id, tm.mensaje, tm.fecha, tm.usuario_id, tm.usuario_nombre,
               u.nombre_completo as db_nombre, u.rol as db_rol
        FROM tablon_mensajes tm
        LEFT JOIN usuarios u ON tm.usuario_id = u.id_usuario
        ORDER BY tm.id DESC
        LIMIT 50
      `;
      const result: any = await pool.query(query);
      const rows = result.rows || [];

      // Process and clean up messages for frontend JSON response
      const mensajesFormateados = rows.map((row: any) => {
        let text = row.mensaje || '';
        let usuario = row.db_nombre || row.usuario_nombre || 'Usuario';

        // Check if legacy message was saved as "[Nombre] texto"
        if (text.startsWith('[')) {
          const match = text.match(/^\[(.*?)\]\s*(.*)$/);
          if (match) {
            if (usuario === 'Usuario' || !row.usuario_nombre) {
              usuario = match[1];
            }
            text = match[2];
          }
        }

        return {
          id: row.id,
          mensaje: text,
          fecha: row.fecha,
          usuario: usuario,
          usuario_id: row.usuario_id || null,
          rol: row.db_rol || 'alumno'
        };
      });

      return res.json(mensajesFormateados);
    }
  } catch (err) {
    console.error('❌ Error al obtener mensajes:', err);
    return res.status(500).json({ error: 'Error en el servidor al obtener mensajes' });
  }
});

export default router;

