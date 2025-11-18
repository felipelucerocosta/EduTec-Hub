import { Router, type Request, type Response } from 'express';
import pool from './conexion_be'; // 👈 1. Importa el POOL de PostgreSQL

const router = Router();

// Ruta GET para obtener clases (CORREGIDA PARA POSTGRESQL)
router.get('/clases', async (_req: Request, res: Response) => { // 👈 2. Convertido a async
  
  // 👈 3. Consulta SQL corregida (usa "creador" como dice el error)
  const sql = 'SELECT nombre, seccion, materia, aula, creador, codigo FROM clases ORDER BY id DESC';

  try {
    // 👈 4. Usa pool.query con await (sin callbacks)
    const result = await pool.query(sql);
    
    // pg's QueryResult expone las filas en un array 'rows'
    const rows = result && result.rows ? result.rows : [];
    res.json(rows);

  } catch (err) { // 👈 5. Captura de errores
    console.error('❌ Error al consultar clases:', err);
    return res.json([]); // Devolver un array vacío en caso de error
  }
});

export default router;