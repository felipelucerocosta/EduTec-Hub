const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool();

(async () => {
  const hash = await bcrypt.hash('Test1234!', 10);
  
  // Create alumno test user
  const alumno = await pool.query(
    'INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, DNI) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (correo) DO UPDATE SET contrasena=$3 RETURNING id_usuario, correo, rol',
    ['Alumno Test', 'alumno@test.com', hash, 'alumno', '12345678']
  );
  console.log('Alumno:', JSON.stringify(alumno.rows[0]));

  // Create profesor test user
  const profesor = await pool.query(
    'INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, DNI) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (correo) DO UPDATE SET contrasena=$3 RETURNING id_usuario, correo, rol',
    ['Profesor Test', 'profesor@test.com', hash, 'profesor', '87654321']
  );
  console.log('Profesor:', JSON.stringify(profesor.rows[0]));

  await pool.end();
  console.log('Done.');
})().catch(e => { console.error('Error:', e.message); pool.end(); });
