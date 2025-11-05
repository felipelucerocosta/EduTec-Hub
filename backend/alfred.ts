import { Router, Request, Response } from 'express';
import axios, { AxiosRequestConfig } from 'axios';
import pool from './conexion_be'; // 👈 IMPORTAMOS LA CONEXIÓN A POSTGRESQL
import * as bcrypt from 'bcrypt'; // 👈 IMPORTAMOS BCRYPT

// Definición de tipos para la estructura de la conversación
interface ChatContent {
    role: 'user' | 'model'; // 'user' para el usuario, 'model' para la IA
    parts: Array<{ text: string }>;
}

// Interfaz para el cuerpo de la solicitud (req.body) de /ask-alfred
interface AskAlfredBody {
    chatHistory: ChatContent[];
}

// Interfaz para el cuerpo de la solicitud (req.body) de /generate-password
interface GeneratePasswordBody {
    email: string;
    context: string;
}

const router: Router = Router();

// ===================================
// RUTA 1: /ask-alfred (CHAT NORMAL)
// (Sin cambios)
// ===================================
router.post('/ask-alfred', async (req: Request<{}, {}, AskAlfredBody>, res: Response) => {
    const { chatHistory } = req.body;

    if (!chatHistory) {
        return res.status(400).json({ error: 'El historial del chat es requerido.' });
    }

    // (Asegúrate de cambiar esta KEY por una variable de entorno)
    const apiKey: string = "AIzaSyCvttzZon067xS7DnQsgQIgNXvaMFTEpBw";

    if (apiKey === "" || !apiKey) {
        console.error("API Key de Gemini no está configurada.");
        return res.status(500).json({ error: 'Servicio de IA no configurado.' });
    }
    
    const apiUrl: string = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload: { contents: ChatContent[] } = { contents: chatHistory };
    
    try {
        const config: AxiosRequestConfig = {
            headers: { 'Content-Type': 'application/json' }
        };
        const apiResponse = await axios.post(apiUrl, payload, config);

        if (apiResponse.data.candidates && apiResponse.data.candidates.length > 0) {
            const text = apiResponse.data.candidates[0].content.parts[0].text;
            res.status(200).json({ candidates: apiResponse.data.candidates });
        } else {
            res.status(500).json({ error: 'Respuesta no válida de la IA.' });
        }
    } catch (error: unknown) {
        console.error('Error llamando a la API de Gemini:', error);
        res.status(500).json({ error: 'Error interno al contactar la IA.' });
    }
});


// ==========================================================
// RUTA 2: /generate-password (GENERAR Y GUARDAR CONTRASEÑA)
// (Completamente modificada)
// ==========================================================
router.post('/generate-password', async (req: Request<{}, {}, GeneratePasswordBody>, res: Response) => {
    const { email, context } = req.body;
    const apiKey: string = "AIzaSyCvttzZon067xS7DnQsgQIgNXvaMFTEpBw"; // (Usar variable de entorno)

    if (!email) {
        return res.status(400).json({ error: 'El correo es requerido para generar y guardar la contraseña.' });
    }

    try {
        // --- 1. Verificar si el usuario existe en la BD ---
        const userQuery = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [email]);
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Correo no encontrado. No se puede actualizar la contraseña.' });
        }
        const userId = userQuery.rows[0].id_usuario;

        // --- 2. Llamar a la IA de Gemini para generar la contraseña ---
        const prompt = context || `Generar una contraseña segura de 12 caracteres para ${email}`;
        const chatHistory: ChatContent[] = [
            { role: "user", parts: [{ text: "Eres un generador de contraseñas seguras. Responde solo con la contraseña generada, sin texto adicional." }] },
            { role: "model", parts: [{ text: "Entendido." }] },
            { role: "user", parts: [{ text: prompt }] }
        ];
        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const config: AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' } };
        
        const apiResponse = await axios.post(apiUrl, payload, config);
        
        if (!apiResponse.data.candidates || apiResponse.data.candidates.length === 0) {
            throw new Error('La API de IA no generó una contraseña.');
        }
        
        // Limpiamos la contraseña por si la IA añade espacios
        const newPassword = apiResponse.data.candidates[0].content.parts[0].text.trim();

        // --- 3. Hashear la nueva contraseña ---
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // --- 4. Actualizar la contraseña en la base de datos ---
        await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hashedPassword, userId]);
        
        // --- 5. Enviar la contraseña (sin hashear) de vuelta al chat ---
        res.status(200).json({ password: newPassword });

    } catch (error: any) {
        console.error('Error en /generate-password:', error.message);
        res.status(500).json({ error: 'Error interno al generar y guardar la contraseña.' });
    }
});


export default router;