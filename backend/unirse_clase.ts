import express, { type Request, type Response } from 'express';
import session from 'express-session';
import mysql from 'mysql';

declare module 'express-session' {
  interface SessionData {
    alumno_id?: number;
  }
}

const app = express();

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'una-clave-muy-secreta-y-larga',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Configuración de la conexión MySQL
const conexion = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'edutec'
});

conexion.connect((err: any) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conexión a la base de datos establecida.');
  }
});

// Ruta POST para unirse a una clase
app.post('/unirse-clase', (req: Request, res: Response) => {
  const alumno_id = req.session?.alumno_id;
  if (!alumno_id) {
    return res.send('Debes iniciar sesión como alumno.');
  }

  const materia: string = req.body.materia || '';
  const codigo: string = req.body.codigo || '';

  if (!materia || !codigo) {
    return res.send('Datos incompletos.');
  }

  // Verificar si ya está unido a la clase
  const verificarSql = `
    SELECT * FROM alumnos_clases 
    WHERE alumno_id = ? AND materia = ?
  `;

  conexion.query(verificarSql, [alumno_id, materia], (err, results: any) => {
    if (err) {
      console.error('Error en la base de datos (verificar):', err);
      return res.send('Error en la base de datos.');
    }

    if (Array.isArray(results) && results.length > 0) {
      return res.send(`Ya estás unido a la clase de ${materia}.`);
    }

    // Insertar la relación
    const insertSql = `
      INSERT INTO alumnos_clases (alumno_id, materia, codigo) 
      VALUES (?, ?, ?)
    `;

    conexion.query(insertSql, [alumno_id, materia, codigo], (insertErr) => {
      if (insertErr) {
        console.error('Error en la base de datos (insert):', insertErr);
        return res.send('Error al unirse a la clase.');
      }
      res.send(`¡Te has unido a la clase de ${materia}!`);
    });
  });
});

// Iniciar servidor
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
