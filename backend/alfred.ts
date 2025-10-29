import { Router, Request, Response } from 'express';
import axios, { AxiosRequestConfig } from 'axios';

// Definición de tipos para la estructura de la conversación
interface ChatContent {
    role: 'user' | 'model'; // 'user' para el usuario, 'model' para la IA
    parts: Array<{ text: string }>;
}

// Interfaz para el cuerpo de la solicitud (req.body)
interface AskAlfredBody {
    chatHistory: ChatContent[];
}

const router: Router = Router();

router.post('/ask-alfred', async (req: Request<{}, {}, AskAlfredBody>, res: Response) => {
    // La desestructuración con tipado nos asegura que chatHistory es un array de ChatContent
    const { chatHistory } = req.body;

    if (!chatHistory) {
        return res.status(400).json({ error: 'El historial del chat es requerido.' });
    }

    // --- CORRECCIÓN AQUÍ ---
    // Pega la API Key que generaste en Google AI Studio.
    // Es **altamente recomendado** usar variables de entorno (process.env.GEMINI_API_KEY)
    // para las claves secretas en un entorno de producción.
    const apiKey: string = "AIzaSyCvttzZon067xS7DnQsgQIgNXvaMFTEpBw";

    if (apiKey === "" || !apiKey) {
        // En un entorno real, `apiKey` debería venir de `process.env` y no del código fuente.
        return res.status(500).json({ error: 'La API Key no ha sido configurada en el servidor.' });
    }

    // Estructura del payload con tipado
    const payload: { contents: ChatContent[] } = { contents: chatHistory };
   
    // URL de la API con la clave
    const apiUrl: string = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        // Configuración para la solicitud de Axios
        const config: AxiosRequestConfig = {
            headers: { 'Content-Type': 'application/json' }
        };

        const apiResponse = await axios.post(apiUrl, payload, config);

        // TypeScript infiere el tipo de apiResponse.data
        res.status(200).json(apiResponse.data);

    } catch (error: unknown) {
        console.error("======================================================");
        console.error("ERROR DETALLADO AL LLAMAR A LA API DE GEMINI:");
       
        // Uso de `isAxiosError` para un manejo de errores más robusto con tipado.
        if (axios.isAxiosError(error) && error.response) {
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
        } else if (error instanceof Error) {
            console.error('Error', error.message);
        } else {
            console.error('An unknown error occurred');
        }
        console.error("======================================================");
       
        res.status(500).json({ error: 'Error interno al contactar el servicio de IA.' });
    }
});

export default router; // Usamos 'export default' en TypeScript
