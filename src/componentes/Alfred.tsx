import React, { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from "react";
import "../alfred.css"; 

// ---- Interfaces ----
interface Message {
  sender: "user" | "alfred";
  text: string;
}

interface ChatPart {
  text: string;
}

interface ChatMessage {
  role: "user" | "model";
  parts: ChatPart[];
}

// --- Constantes ---
const ALUMNO_DOMAIN = "@alu.tecnica29de6.edu.ar";
const PROFESOR_DOMAIN = "@tecnica29de6.edu.ar";
const API_URL = "http://localhost:3001/api"; // URL base de tu backend

const AlfredIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M12 8v4l2 2" />
    <path d="M7.5 12.5s.5-1 2.5-1 2.5 1 2.5 1" />
    <path d="M16.5 12.5s.5-1 2.5-1 2.5 1 2.5 1" />
  </svg>
);

const Alfred: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "alfred", text: "Hola, soy Alfred. ¿En qué puedo servirle? Puedo ayudarte con 'ayuda login' o 'generar contraseña'." },
  ]);
  const [userInput, setUserInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [awaitingEmailForPassword, setAwaitingEmailForPassword] = useState<boolean>(false); // Nuevo estado
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  const addAlfredMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: "alfred", text }]);
  };
  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
  };

  const getAlfredResponse = async (prompt: string): Promise<void> => {
    setIsLoading(true);

    const chatHistory: ChatMessage[] = [
      {
        role: "user",
        parts: [
          {
            text: "Eres Alfred, un asistente virtual servicial, educado y algo formal, como un mayordomo. Responde de manera concisa y útil a las preguntas del usuario. Tu nombre es Alfred. No te desvíes del rol de asistente de escuela técnica.",
          },
        ],
      },
      { role: "model", parts: [{ text: "Entendido. Estoy a su servicio." }] },
      
      // Historial de mensajes para el modelo de IA
      ...messages.map((msg) => ({
        // Traduce 'alfred' (de tu estado) a 'model' (para la API)
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }],
      })),
      // ===================================
      // FIN DE LA CORRECCIÓN
      // ===================================

      { role: "user", parts: [{ text: prompt }] },
    ];

    try {
      const response = await fetch(`${API_URL}/ask-alfred`, { // Usa API_URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        addAlfredMessage(text);
      } else {
        const errorMessage =
          result.error ||
          "Mis disculpas, no he podido procesar su solicitud en este momento.";
        addAlfredMessage(errorMessage);
      }
    } catch (error: any) {
      console.error("Error al contactar con el servidor local:", error);
      addAlfredMessage(
        "Mis disculpas, parece que hay un problema de conexión con nuestro servidor o mi sistema de IA. Por favor, intente de nuevo más tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Nueva función para generar contraseña (llamada desde Alfred)
  const generatePasswordWithAlfred = async (email: string) => {
    setIsLoading(true);
    addAlfredMessage("Entendido. Estoy generando una contraseña segura para usted...");

    try {
      const response = await fetch(`${API_URL}/generate-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Contexto para la IA
          context: `Generar una contraseña segura de 12 caracteres con mayúsculas, minúsculas y números para el usuario con correo ${email}.`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.password) {
        addAlfredMessage(`Su nueva contraseña sugerida es: ${data.password}. Le recomiendo copiarla y usarla de inmediato.`);
        // Opcional: copiar al portapapeles
        navigator.clipboard.writeText(data.password).then(() => {
            addAlfredMessage("La contraseña ha sido copiada automáticamente al portapapeles.");
        });
      } else {
        throw new Error(data.error || "No se pudo generar la contraseña.");
      }
    } catch (error: any) {
      console.error("Error al generar contraseña:", error);
      addAlfredMessage(`Mis disculpas, no pude generar la contraseña. ${error.message}`);
    } finally {
      setIsLoading(false);
      setAwaitingEmailForPassword(false); // Resetea el estado
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (userInput.trim() === "" || isLoading) return;

    const userMessageText = userInput.trim();
    addUserMessage(userMessageText);
    setUserInput("");

    // --- Lógica de Comandos de Alfred ---
    if (awaitingEmailForPassword) {
      // Si estamos esperando un correo para la contraseña
      if (userMessageText.endsWith(ALUMNO_DOMAIN) || userMessageText.endsWith(PROFESOR_DOMAIN)) {
        generatePasswordWithAlfred(userMessageText);
      } else {
        addAlfredMessage("Ese no parece un correo institucional válido. Por favor, ingrese su correo institucional para generar una contraseña.");
      }
      setAwaitingEmailForPassword(false); // Resetea después de intentar procesar
      return;
    }

    const lowerCaseMessage = userMessageText.toLowerCase();

    if (lowerCaseMessage.includes("generar contraseña")) {
      addAlfredMessage("Entendido. Por favor, ingrese su correo institucional para poder generar una contraseña segura.");
      setAwaitingEmailForPassword(true); // Activa el estado de espera
    } else if (lowerCaseMessage.includes("ayuda login") || lowerCaseMessage.includes("ayuda inicio sesion")) {
      addAlfredMessage("Para iniciar sesión, por favor use su correo institucional (@alu.tecnica29de6.edu.ar o @tecnica29de6.edu.ar) y su contraseña. Si ha olvidado su contraseña, puede usar el enlace '¿Olvidaste tu contraseña?' en la página de inicio de sesión para restablecerla.");
    } else {
      // Si no es un comando especial, envía al modelo de IA
      getAlfredResponse(userMessageText);
    }
  };

  return (
    <>
      <button onClick={toggleChat} className="alfred-toggle-button">
        <AlfredIcon />
      </button>

      {isOpen && (
        <div className="alfred-chat-window">
          <div className="alfred-header">
            <h3>Asistente Alfred</h3>
            <button onClick={toggleChat} className="alfred-close-button">
              &times;
            </button>
          </div>

          <div className="alfred-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`alfred-message ${msg.sender}`}>
                <p>{msg.text}</p>
              </div>
            ))}

            {isLoading && (
              <div className="alfred-message alfred typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="alfred-input-form">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder={awaitingEmailForPassword ? "Ingrese su correo institucional..." : "Escriba su consulta..."}
              aria-label="Escriba su consulta"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Alfred;