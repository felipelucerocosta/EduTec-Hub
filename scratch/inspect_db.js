const path = require('path');
const Module = require('module');
const candidateNodeModules = [
  path.resolve(process.cwd(), 'backend/node_modules'),
  path.resolve(process.cwd(), 'node_modules'),
];
process.env.NODE_PATH = candidateNodeModules.join(path.delimiter);
Module._initPaths();

const pool = require('../dist_backend/backend/conexion_pg').default;

async function inspect() {
  console.log('=== CLASES ===');
  const clases = await pool.query('SELECT id, nombre, titular_id, creador_id, creador, codigo FROM clases');
  console.log(clases.rows);

  console.log('=== PROFESORES_CLASES ===');
  const pc = await pool.query('SELECT * FROM profesores_clases');
  console.log(pc.rows);

  console.log('=== USUARIOS PROFESORES ===');
  const profs = await pool.query('SELECT id_usuario, nombre_completo, rol, correo FROM usuarios WHERE LOWER(TRIM(rol)) = "profesor"');
  console.log(profs.rows);

  console.log('=== TABLA PROFESOR ===');
  try {
    const profTable = await pool.query('SELECT * FROM profesor');
    console.log(profTable.rows);
  } catch (e) {
    console.log('Error o no existe tabla profesor:', e.message);
  }

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
