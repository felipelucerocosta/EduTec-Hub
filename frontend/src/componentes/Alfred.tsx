import React, { useState, useRef, useEffect } from "react";
import "../alfred.css";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config/api";

// ─── Árbol de decisiones ────────────────────────────────────────────────────
interface TreeNode {
  id: string;
  text: string;          // Lo que Alfred dice
  options?: Option[];    // Botones de respuesta rápida
  inputRequired?: "email" | "text"; // Si necesita texto libre
  action?: "reset_password" | "navigate"; // Acción especial
  actionTarget?: string; // URL para navigate
}

interface Option {
  label: string;
  icon?: string;
  nextId: string;
}

const TREE: Record<string, TreeNode> = {
  start: {
    id: "start",
    text: "¡Buenas! Soy Alfred 🎩, el asistente de Edutech. ¿En qué le puedo ayudar hoy? Puede elegir una opción rápida o escribirme una pregunta libre directamente.",
    options: [
      { label: "🔑 Problemas con mi cuenta", icon: "bx-key", nextId: "cuenta" },
      { label: "📚 Cómo usar la plataforma", icon: "bx-help-circle", nextId: "plataforma" },
      { label: "🏫 Clases y materias", icon: "bx-book", nextId: "clases" },
      { label: "📅 Calendario y foro", icon: "bx-calendar", nextId: "calendario" },
      { label: "🤖 Hacer consulta a la IA (Gemini)", icon: "bx-bot", nextId: "modo_ia" },
      { label: "💬 Otro tema", icon: "bx-chat", nextId: "otro" },
    ],
  },

  // ── CUENTA ────────────────────────────────────────────────────────────────
  cuenta: {
    id: "cuenta",
    text: "Entendido. ¿Cuál es el problema con su cuenta?",
    options: [
      { label: "🔒 Olvidé mi contraseña", nextId: "olvide_password" },
      { label: "📧 No puedo ingresar con mi correo", nextId: "correo_no_funciona" },
      { label: "❌ Mi cuenta fue bloqueada", nextId: "cuenta_bloqueada" },
      { label: "✏️ Quiero cambiar mis datos", nextId: "cambiar_datos" },
      { label: "← Volver", nextId: "start" },
    ],
  },

  olvide_password: {
    id: "olvide_password",
    text: "Sin problema. Puede recuperar su contraseña de dos maneras:\n\n1️⃣ Desde la página de login, haga clic en '¿Olvidaste tu contraseña?'\n2️⃣ O le puedo ayudar a enviar el enlace de recuperación ahora mismo.\n\n¿Qué prefiere?",
    options: [
      { label: "📨 Enviar enlace de recuperación", nextId: "email_reset" },
      { label: "ℹ️ Ir al login yo mismo", nextId: "ir_login" },
      { label: "← Volver", nextId: "cuenta" },
    ],
  },

  email_reset: {
    id: "email_reset",
    text: "Por favor, ingrese su dirección de correo electrónico registrada en el campo de texto y le enviamos el enlace.",
    inputRequired: "email",
  },

  reset_enviado: {
    id: "reset_enviado",
    text: "✅ ¡Listo! Si el correo está registrado, recibirá un enlace en su bandeja de entrada en los próximos minutos.\n\nRecuerde revisar también la carpeta de correo no deseado (spam).",
    options: [
      { label: "👍 Gracias", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  reset_error: {
    id: "reset_error",
    text: "⚠️ Hubo un problema al enviar el correo. Por favor intente desde la página de login directamente o contacte al administrador.",
    options: [
      { label: "🔄 Intentar de nuevo", nextId: "email_reset" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  ir_login: {
    id: "ir_login",
    text: "En la página de inicio de sesión, debajo del botón 'Iniciar Sesión', encontrará el enlace '¿Olvidaste tu contraseña?'. Al hacer clic se le pedirá su correo y recibirá el enlace por email.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  correo_no_funciona: {
    id: "correo_no_funciona",
    text: "Puede ingresar con cualquier correo electrónico válido. ¿El error que le aparece es...?",
    options: [
      { label: "❌ 'Credenciales incorrectas'", nextId: "credenciales_incorrectas" },
      { label: "🚫 'Usuario no encontrado'", nextId: "usuario_no_encontrado" },
      { label: "⚠️ Error del servidor", nextId: "error_servidor" },
      { label: "← Volver", nextId: "cuenta" },
    ],
  },

  credenciales_incorrectas: {
    id: "credenciales_incorrectas",
    text: "Si aparece 'credenciales incorrectas', significa que el correo o la contraseña no coinciden. Verifique:\n\n• Que esté usando el correo registrado\n• Que la contraseña no tenga espacios extra\n• Que mayúsculas y minúsculas sean correctas",
    options: [
      { label: "🔑 Recuperar contraseña", nextId: "olvide_password" },
      { label: "✅ Voy a intentarlo", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  usuario_no_encontrado: {
    id: "usuario_no_encontrado",
    text: "Si su correo no está registrado en el sistema, deberá crear una cuenta nueva desde la pestaña 'Crear Cuenta'.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  error_servidor: {
    id: "error_servidor",
    text: "Si hay un error del servidor, intente refrescar la página o contacte al administrador: felipelucero534@gmail.com",
    options: [
      { label: "📧 Anotado, gracias", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  cuenta_bloqueada: {
    id: "cuenta_bloqueada",
    text: "Las cuentas se bloquean temporalmente tras varios intentos fallidos. Espere 15 minutos o recupere su contraseña.",
    options: [
      { label: "🔑 Recuperar contraseña", nextId: "olvide_password" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  cambiar_datos: {
    id: "cambiar_datos",
    text: "Los cambios de datos personales deben solicitarse al administrador: felipelucero534@gmail.com",
    options: [
      { label: "📧 Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  // ── PLATAFORMA ─────────────────────────────────────────────────────────────
  plataforma: {
    id: "plataforma",
    text: "Con gusto le explico cómo funciona Edutech. ¿Qué necesita saber?",
    options: [
      { label: "📝 Cómo registrarme", nextId: "como_registrarse" },
      { label: "🏛️ Cómo acceder a mis clases", nextId: "como_clases" },
      { label: "📤 Cómo entregar un trabajo", nextId: "como_trabajo" },
      { label: "🗓️ Cómo ver el calendario", nextId: "como_calendario" },
      { label: "← Volver", nextId: "start" },
    ],
  },

  como_registrarse: {
    id: "como_registrarse",
    text: "Para registrarse:\n1️⃣ Vaya a la pantalla inicial\n2️⃣ Seleccione 'Crear Cuenta'\n3️⃣ Elija rol (Alumno o Profesor)\n4️⃣ Ingrese sus datos y contraseña",
    options: [
      { label: "✅ Gracias", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  como_clases: {
    id: "como_clases",
    text: "👨‍🎓 Alumnos: Vayan a 'Mis Clases' e ingresen con el código del profesor.\n👨‍🏫 Profesores: En 'Mis Clases' pueden crear aulas y ver sus alumnos.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  como_trabajo: {
    id: "como_trabajo",
    text: "Para entregar un trabajo:\n1️⃣ Ingrese a la clase correspondiente\n2️⃣ Haga clic en la tarea publicada\n3️⃣ Adjunte el archivo o comentario y presione Entregar.",
    options: [
      { label: "✅ Perfecto", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  como_calendario: {
    id: "como_calendario",
    text: "El calendario permite anotar recordatorios de exámenes y entregas. Lo encuentra en la barra de navegación.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  // ── CLASES ────────────────────────────────────────────────────────────────
  clases: {
    id: "clases",
    text: "¿Qué consulta tiene sobre clases y materias?",
    options: [
      { label: "🔗 Cómo unirme a una clase", nextId: "como_unirse" },
      { label: "📌 No veo mis clases", nextId: "no_veo_clases" },
      { label: "← Volver", nextId: "start" },
    ],
  },

  como_unirse: {
    id: "como_unirse",
    text: "Para unirse a una clase, pídale al profesor el código de 6 caracteres e ingréselo en 'Unirse a clase'.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  no_veo_clases: {
    id: "no_veo_clases",
    text: "Verifique estar usando la cuenta adecuada y que haya ingresado correctamente el código de clase.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  calendario: {
    id: "calendario",
    text: "En la sección Calendario puede agendar tareas y fechas importantes.",
    options: [
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  modo_ia: {
    id: "modo_ia",
    text: "💡 Modo Inteligencia Artificial activo (Gemini). Escriba cualquier consulta técnica, académica o duda abajo y con gusto le responderé.",
    options: [
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  otro: {
    id: "otro",
    text: "Escriba su consulta en el campo de texto abajo o contacte a felipelucero534@gmail.com",
    options: [
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  cierre: {
    id: "cierre",
    text: "¡Ha sido un placer asistirle! ¿Hay algo más en lo que pueda ayudarle?",
    options: [
      { label: "🏠 Menú principal", nextId: "start" },
      { label: "👋 No, hasta luego", nextId: "adios" },
    ],
  },

  adios: {
    id: "adios",
    text: "¡Hasta luego! Que tenga un excelente día. Estaré aquí si me necesita. 🎩",
    options: [
      { label: "🏠 Volver al menú", nextId: "start" },
    ],
  },
};

// ─── Interfaces de mensajes ────────────────────────────────────────────────
interface Message {
  sender: "user" | "alfred";
  text: string;
  options?: Option[];
}

interface AlfredProps {
  isOpenOverride?: boolean;
  onCloseOverride?: () => void;
}

const Alfred: React.FC<AlfredProps> = ({ isOpenOverride, onCloseOverride }) => {
  const { user } = useAuth();
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenOverride !== undefined ? isOpenOverride : isOpenInternal;
  const setIsOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    setIsOpenInternal(prev => {
      const next = typeof open === "function" ? open(prev) : open;
      if (!next && onCloseOverride) onCloseOverride();
      return next;
    });
  };
  const [, setCurrentNode] = useState<string>("start");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpenInternal(prev => !prev);
    };
    window.addEventListener("toggle-alfred", handleToggle);
    return () => window.removeEventListener("toggle-alfred", handleToggle);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const node = TREE["start"];
      setMessages([{ sender: "alfred", text: node.text, options: node.options }]);
      setCurrentNode("start");
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const addAlfredMessage = (nodeId: string) => {
    const node = TREE[nodeId];
    if (!node) return;
    setCurrentNode(nodeId);
    setMessages(prev => [...prev, {
      sender: "alfred",
      text: node.text,
      options: node.options,
    }]);

    if (node.inputRequired === "email") {
      setAwaitingEmail(true);
    } else {
      setAwaitingEmail(false);
    }
  };

  const handleOption = (option: Option) => {
    setMessages(prev => [...prev, { sender: "user", text: option.label }]);
    setIsLoading(true);
    setTimeout(() => {
      addAlfredMessage(option.nextId);
      setIsLoading(false);
    }, 400);
  };

  // Enviar mensaje libre o email a backend / Gemini
  const handleFreeInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    setMessages(prev => [...prev, { sender: "user", text: query }]);
    setInputText("");
    setIsLoading(true);

    if (awaitingEmail) {
      setAwaitingEmail(false);
      try {
        const res = await fetch(`${API_URL}/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo: query }),
        });
        const data = await res.json();
        setIsLoading(false);
        if (res.ok) {
          addAlfredMessage("reset_enviado");
        } else {
          setMessages(prev => [...prev, { sender: "alfred", text: data.reply || data.error || "No se pudo procesar la solicitud." }]);
        }
      } catch {
        setIsLoading(false);
        addAlfredMessage("reset_error");
      }
      return;
    }

    // Consulta libre con Gemini AI en /api/ask-alfred
    if (!user) {
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          sender: "alfred",
          text: "Para realizar consultas con IA con Alfred, por favor inicia sesión en la plataforma primero.",
          options: [{ label: "🏠 Menú principal", nextId: "start" }]
        }
      ]);
      return;
    }

    // Armar historial de conversación
    const historyPayload = messages
      .filter(m => m.text && !m.text.includes("¡Buenas! Soy Alfred"))
      .slice(-6)
      .map(m => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.text }]
      }));

    historyPayload.push({
      role: "user" as const,
      parts: [{ text: query }]
    });

    try {
      const res = await fetch(`${API_URL}/ask-alfred`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatHistory: historyPayload }),
      });

      const data = await res.json();
      setIsLoading(false);

      const aiText = data.response || data.reply || data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (res.ok && aiText && !data.error) {
        setMessages(prev => [
          ...prev,
          {
            sender: "alfred",
            text: aiText,
            options: [
              { label: "🤖 Otra consulta IA", nextId: "modo_ia" },
              { label: "🏠 Menú principal", nextId: "start" }
            ]
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: "alfred",
            text: data.reply || data.error || "Disculpe, la IA no pudo responder en este momento.",
            options: [{ label: "🏠 Menú principal", nextId: "start" }]
          }
        ]);
      }
    } catch (err) {
      console.error("Error al consultar Alfred AI:", err);
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          sender: "alfred",
          text: "⚠️ No fue posible conectar con el servidor de la IA. Verifique su conexión.",
          options: [{ label: "🏠 Menú principal", nextId: "start" }]
        }
      ]);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentNode("start");
    setAwaitingEmail(false);
    setInputText("");
    const node = TREE["start"];
    setTimeout(() => {
      setMessages([{ sender: "alfred", text: node.text, options: node.options }]);
    }, 100);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="alfred-toggle-button"
        aria-label="Abrir asistente Alfred"
        title="Alfred - Asistente Edutech"
      >
        <i className="bx bx-bot" style={{ fontSize: "1.5rem" }}></i>
      </button>

      {isOpen && (
        <div className="alfred-chat-window">
          {/* Header */}
          <div className="alfred-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #38bdf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem"
              }}>🎩</div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Alfred</h3>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>Asistente EduTec-Hub (IA Gemini)</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={resetChat}
                className="alfred-close-button"
                title="Reiniciar conversación"
                style={{ fontSize: "0.8rem", opacity: 0.7 }}
              >
                <i className="bx bx-refresh"></i>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="alfred-close-button"
                aria-label="Cerrar chat"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="alfred-messages">
            {messages.map((msg, index) => (
              <div key={index}>
                <div className={`alfred-message ${msg.sender}`}>
                  {msg.sender === "alfred" && (
                    <span style={{ fontSize: "1rem", marginRight: "0.3rem", flexShrink: 0 }}>🎩</span>
                  )}
                  <p style={{ whiteSpace: "pre-line", margin: 0 }}>{msg.text}</p>
                </div>

                {msg.sender === "alfred" && msg.options && index === messages.length - 1 && !isLoading && (
                  <div className="alfred-options">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        className="alfred-option-btn"
                        onClick={() => handleOption(opt)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="alfred-message alfred typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de entrada libre para cualquier pregunta o correo */}
          <form onSubmit={handleFreeInputSubmit} className="alfred-input-form" style={{ padding: '8px', display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={awaitingEmail ? "tu@correo.com" : "Escribe tu duda o consulta a Alfred..."}
              autoComplete="off"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '0.85rem'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed, #38bdf8)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <i className="bx bx-send"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Alfred;