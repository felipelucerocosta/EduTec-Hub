import { Router, type Request, type Response } from 'express';
import conexion from './conexion_be';

const router = Router();

// Ruta GET para obtener clases
router.get('/clases', (_req: Request, res: Response) => {
  void _req;
  conexion.query(
    'SELECT nombre, seccion, materia, aula, creador, codigo FROM clases ORDER BY id DESC',
    (err: any, result: any) => {
      if (err) {
        console.error('❌ Error al consultar clases:', err);
        return res.json([]);
      }
      // pg's QueryResult exposes rows as an array
      const rows = result && result.rows ? result.rows : [];
      res.json(rows);
    }
  );
});

export default router;
