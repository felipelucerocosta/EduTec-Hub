import { Router, type Request, type Response } from 'express';
import pool from './conexion_pg';

const router = Router();

interface MensajeRow {
  mensaje: string;
  fecha: Date | string;
}

router.get('/mensajes-legacy', async (_req: Request, res: Response) => {
  const sql = `
    SELECT mensaje, fecha 
    FROM tablon_mensajes 
    ORDER BY id DESC 
    LIMIT 30
  `;

  try {
    const result = await pool.query(sql);
    const results: MensajeRow[] = result && Array.isArray(result.rows) ? result.rows : [];

    let html = '';
    results.forEach(row => {
      const fecha = new Date(row.fecha);
      const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth()+1).toString().padStart(2, '0')}/${fecha.getFullYear()} ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
      const mensaje = escapeHtml(row.mensaje);
      html += `<div style='margin-bottom:10px;'><b>${fechaFormateada}:</b> ${mensaje}</div>`;
    });

    res.send(html);
  } catch (err) {
    console.error("❌ Error al obtener mensajes:", err);
    res.status(500).send("Error en el servidor.");
  }
});

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default router;
