import path from 'path';
import express from 'express';
import cors from 'cors';
import session from 'express-session';   // Importar session para gestionar la sesión
import registroRouter from './registro';
import obtenerClasesAlumnoRouter from './obtener_clases_alumno';
import router from './api_rutas';   // Importamos tus rutas de API

const app = express();

const PORT: number = Number(process.env.PORT) || 3000;

// Configuración de CORS (puedes personalizarla si es necesario)
app.use(cors());

// Middleware para manejo de cuerpos de solicitud (req.body)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de sesión (configura esto según tus necesidades)
app.use(session({
  secret: 'tu_secreto_aqui',  // Debes definir un valor secreto para la sesión
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Si usas https, cambia esto a 'true'
}));

// Directorio estático para servir archivos HTML y otros recursos estáticos
app.use(express.static(path.join(__dirname, 'HTML')));

// Montar las rutas de API para obtener clases del alumno
app.use('/api', obtenerClasesAlumnoRouter);

// Montar las rutas de la API principal (api_rutas)
app.use('/api', router);  // Aquí añades las rutas del archivo api_rutas.ts

// Montar la ruta para registro (suponiendo que es una ruta separada)
app.use('/', registroRouter);

// Iniciar el servidor en el puerto configurado
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
