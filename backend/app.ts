import path from 'path';
import express from 'express';
import cors from 'cors';
import registroRouter from './registro';
import obtenerClasesAlumnoRouter from './obtener_clases_alumno';
const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'HTML')));
app.use('/api', obtenerClasesAlumnoRouter); // 👈 AÑADIR ESTO


app.use('/', registroRouter);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
