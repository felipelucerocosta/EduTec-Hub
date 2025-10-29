import React, { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import "./Alfred.css";

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

const Alfred: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "alfred", text: "Hola, soy Alfred. ¿En qué puedo servirle?" },
  ]);
  const [userInput, setUserInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  const getAlfredResponse = async (prompt: string): Promise<void> => {
    setIsLoading(true);

    const chatHistory: ChatMessage[] = [
      {
        role: "user",
        parts: [
          {
            text: "Eres Alfred, un asistente virtual servicial, educado y algo formal, como un mayordomo. Responde de manera concisa y útil a las preguntas del usuario.",
          },
        ],
      },
      { role: "model", parts: [{ text: "Entendido. Estoy a su servicio." }] },
      ...messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      })),
      { role: "user", parts: [{ text: prompt }] },
    ];

    const localApiUrl = "http://localhost:3001/api/ask-alfred";

    try {
      const response = await fetch(localApiUrl, {
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
        setMessages((prev) => [...prev, { sender: "alfred", text }]);
      } else {
        const errorMessage =
          result.error ||
          "Disculpe, no he podido procesar su solicitud en este momento.";
        setMessages((prev) => [...prev, { sender: "alfred", text: errorMessage }]);
      }
    } catch (error) {
      console.error("Error al contactar con el servidor local:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "alfred",
          text: "Mis disculpas, parece que hay un problema de conexión con nuestro servidor.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (event: FormEvent) => {
    event.preventDefault();
    if (userInput.trim() === "" || isLoading) return;

    const newUserMessage: Message = { sender: "user", text: userInput };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    getAlfredResponse(userInput);
    setUserInput("");
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
              placeholder="Escriba su consulta..."
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
