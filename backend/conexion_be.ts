import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '1234',
  database: process.env.DB_NAME || 'eductechub',
  port: Number(process.env.DB_PORT) || 5432
});

pool.connect()
  .then(client => {
    client.release();
    console.log('✅ Conectado a la base de datos PostgreSQL.');
  })
  .catch((err: Error) => {
    console.error('❌ Error de conexión a la base de datos:', err.message);
  });

export default pool;