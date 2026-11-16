import pool from './conexion_pg';
import { getSocketIO, classRoom } from './socket_bus';
import type { UsuarioSesion } from './permisos';

export async function getClassIdsForUser(usuario: Pick<UsuarioSesion, 'id' | 'rol' | 'isAdmin'>): Promise<number[]> {
  if (!usuario?.id) return [];

  if (usuario.rol === 'admin' || usuario.isAdmin) {
    return [];
  }

  if (usuario.rol === 'profesor') {
    const r = await pool.query(
      `SELECT id FROM clases WHERE titular_id = $1
       UNION
       SELECT clase_id AS id FROM profesores_clases WHERE profesor_id = $1`,
      [usuario.id]
    );
    return (r.rows || []).map((row: any) => Number(row.id)).filter((id: number) => !isNaN(id));
  }

  if (usuario.rol === 'preceptor') {
    const r = await pool.query(
      `SELECT clase_id AS id FROM preceptores_clases WHERE preceptor_id = $1`,
      [usuario.id]
    );
    return (r.rows || []).map((row: any) => Number(row.id)).filter((id: number) => !isNaN(id));
  }

  const r = await pool.query(
    `SELECT c.id FROM clases c
     JOIN alumnos_clases ac ON LOWER(TRIM(ac.codigo)) = LOWER(TRIM(c.codigo))
     WHERE ac.alumno_id = $1`,
    [usuario.id]
  );
  return (r.rows || []).map((row: any) => Number(row.id)).filter((id: number) => !isNaN(id));
}

export async function getMemberUserIdsForClass(claseId: number): Promise<number[]> {
  const ids = new Set<number>();
  const claseQ = await pool.query(
    `SELECT titular_id, codigo FROM clases WHERE id = $1`,
    [claseId]
  );
  if (!claseQ.rows.length) return [];

  const { titular_id, codigo } = claseQ.rows[0];
  if (titular_id) ids.add(Number(titular_id));

  try {
    const profs = await pool.query(
      `SELECT profesor_id FROM profesores_clases WHERE clase_id = $1`,
      [claseId]
    );
    for (const row of profs.rows) ids.add(Number(row.profesor_id));
  } catch (_e) {}

  try {
    const prec = await pool.query(
      `SELECT preceptor_id FROM preceptores_clases WHERE clase_id = $1`,
      [claseId]
    );
    for (const row of prec.rows) ids.add(Number(row.preceptor_id));
  } catch (_e) {}

  const alumnos = await pool.query(
    `SELECT alumno_id FROM alumnos_clases WHERE LOWER(TRIM(codigo)) = LOWER(TRIM($1))`,
    [codigo]
  );
  for (const row of alumnos.rows) ids.add(Number(row.alumno_id));

  return Array.from(ids).filter((id) => !isNaN(id) && id > 0);
}

export async function syncUserClassRooms(userId: number | string) {
  const numericId = Number(userId);
  if (!numericId) return;

  const io = getSocketIO();
  if (!io) return;

  const uQ = await pool.query(
    `SELECT id_usuario AS id, rol FROM usuarios WHERE id_usuario = $1`,
    [numericId]
  );
  if (!uQ.rows.length) return;

  const usuario = {
    id: numericId,
    rol: uQ.rows[0].rol,
    isAdmin: uQ.rows[0].rol === 'admin',
  };
  const allowed = new Set(await getClassIdsForUser(usuario));
  const sockets = await io.in(`user_${numericId}`).fetchSockets();

  for (const socket of sockets) {
    for (const room of Array.from(socket.rooms)) {
      if (typeof room === 'string' && room.startsWith('clase_')) {
        const id = Number(room.slice(6));
        if (!allowed.has(id)) {
          socket.leave(room);
        }
      }
    }
    for (const id of Array.from(allowed)) {
      socket.join(classRoom(id));
    }
  }
}
