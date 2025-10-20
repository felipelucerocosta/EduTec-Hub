import { Router, type Request, type Response } from 'express';
import 'express-session';
import mysql from 'mysql';

declare module 'express-session' {
  interface SessionData {
    nombre_completo?: string;
  }
}

const router = Router();

router.post('/crear-clase', (req: Request, res: Response) => {
  const conn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '1234',
    database: process.env.DB_NAME || 'eductechub'
  });

  conn.connect((err) => {
    if (err) {
      console.error('Error de conexión MySQL:', err);
      return res.json({ error: 'Error de conexión' });
    }

    const nombre: string = String(req.body.nombre || '').trim();
    const seccion: string = String(req.body.seccion || '').trim();
    const materia: string = String(req.body.materia || '').trim();
    const aula: string = String(req.body.aula || '').trim();
    const creador: string = req.session?.nombre_completo || 'Anónimo';

    // Generar código (3 letras de la materia + 4 dígitos aleatorios)
    const codigo =
      (materia.substring(0, 3) || 'XXX').toUpperCase() +
      Math.floor(1000 + Math.random() * 9000);

    const sql = `INSERT INTO clases (nombre, seccion, materia, aula, creador, codigo)
                 VALUES (?, ?, ?, ?, ?, ?)`;

    conn.query(sql, [nombre, seccion, materia, aula, creador, codigo], (error: any, _result: any) => {
      if (error) {
        console.error('Error al crear la clase:', error);
        conn.end();
        return res.json({ error: 'Error al crear la clase: ' + error.message });
      }

      conn.end();
      return res.json({
        success: true,
        nombre,
        seccion,
        materia,
        aula,
        creador,
        codigo
      });
    });
  });
});

export default router;
