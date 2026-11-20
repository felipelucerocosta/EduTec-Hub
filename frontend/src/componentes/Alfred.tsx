import React, { useState, useRef, useEffect } from "react";
import "../alfred.css";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config/api";
import AlfredMarkdown from "./AlfredMarkdown";

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
    text: "¡Buenas! Soy Alfred 🎩, el asistente de inteligencia artificial de EduTech. ¿En qué le puedo ayudar hoy? Puede elegir una opción rápida o hacerme cualquier consulta académica, técnica o libre.",
    options: [
      { label: "🤖 Hacer consulta libre con IA", icon: "bx-bot", nextId: "modo_ia" },
      { label: "🔑 Problemas con mi cuenta", icon: "bx-key", nextId: "cuenta" },
      { label: "📚 Cómo usar la plataforma", icon: "bx-help-circle", nextId: "plataforma" },
      { label: "🏫 Clases y materias", icon: "bx-book", nextId: "clases" },
      { label: "📅 Calendario académico", icon: "bx-calendar", nextId: "calendario" },
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
    text: "Con gusto le explico cómo funciona EduTech. ¿Qué necesita saber?",
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
    text: "Para registrarse:\n1️⃣ Vaya a la pantalla inicial\n2️⃣ Seleccione 'Crear Cuenta'\n3️⃣ Elija rol (Alumno, Profesor o Preceptor)\n4️⃣ Ingrese sus datos y contraseña",
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
    text: "Para entregar un trabajo:\n1️⃣ Ingrese a la clase correspondiente\n2️⃣ Haga clic en la tarea publicada\n3️⃣ Adjunte el archivo o comentario y presione Entregar (en trabajos grupales puede seleccionar a sus compañeros de grupo).",
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
    text: "💡 Modo Inteligencia Artificial activo (Groq AI). Puede consultarme sobre matemáticas, física, programación, redes, redacción, ejercicios o dudas conceptuales. Escriba su pregunta abajo.",
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

// ─── Interfaces ────────────────────────────────────────────────────────────
interface Message {
  sender: "user" | "alfred";
  text: string;
  options?: Option[];
  isStreaming?: boolean;
}

interface ConversacionItem {
  id: number;
  titulo: string;
  actualizado_en: string;
  ultimo_mensaje?: string;
  total_mensajes?: number;
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
  const [isThinking, setIsThinking] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [activeConversacionId, setActiveConversacionId] = useState<number | null>(null);

  // Historial de conversaciones
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [conversaciones, setConversaciones] = useState<ConversacionItem[]>([]);
  const [loadingConversaciones, setLoadingConversaciones] = useState(false);
  const [activeModel, setActiveModel] = useState<string>("Groq AI");

  // Error visual
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpenInternal(prev => !prev);
    };
    window.addEventListener("toggle-alfred", handleToggle);
    return () => window.removeEventListener("toggle-alfred", handleToggle);
  }, []);

  // Cargar mensaje inicial si está vacío
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const node = TREE["start"];
      setMessages([{ sender: "alfred", text: node.text, options: node.options }]);
      setCurrentNode("start");
    }
  }, [isOpen]);

  // Cargar lista de conversaciones cuando se abre Alfred
  useEffect(() => {
    if (isOpen && user) {
      fetchConversaciones();
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isThinking]);

  // Cargar lista de conversaciones del usuario
  const fetchConversaciones = async () => {
    if (!user) return;
    setLoadingConversaciones(true);
    try {
      const res = await fetch(`${API_URL}/alfred/conversaciones`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConversaciones(data.conversaciones || []);
        if (data.model) setActiveModel(data.model);
      }
    } catch (err) {
      console.warn("No se pudieron cargar conversaciones previas de Alfred:", err);
    } finally {
      setLoadingConversaciones(false);
    }
  };

  // Cargar una conversación específica desde PostgreSQL
  const handleSelectConversacion = async (convId: number) => {
    setIsLoading(true);
    setShowHistoryDrawer(false);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_URL}/alfred/conversaciones/${convId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setActiveConversacionId(convId);
        const msgs: Message[] = (data.mensajes || []).map((m: any) => ({
          sender: m.rol === "assistant" ? "alfred" : "user",
          text: m.contenido,
        }));
        setMessages(msgs.length > 0 ? msgs : [{ sender: "alfred", text: "Conversación recuperada. ¿En qué puedo ayudarte?" }]);
      }
    } catch (err) {
      console.error("Error al cargar conversación:", err);
      setErrorMessage("No se pudo cargar la conversación seleccionada.");
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar conversación
  const handleDeleteConversacion = async (e: React.MouseEvent, convId: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/alfred/conversaciones/${convId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setConversaciones(prev => prev.filter(c => c.id !== convId));
        if (activeConversacionId === convId) {
          resetChat();
        }
      }
    } catch (err) {
      console.error("Error al eliminar conversación:", err);
    }
  };

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
    }, 300);
  };

  // Enviar mensaje a Groq AI con streaming o respuesta estándar
  const handleFreeInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    setMessages(prev => [...prev, { sender: "user", text: query }]);
    setInputText("");
    setErrorMessage(null);

    // Caso: flujo de recuperación por correo
    if (awaitingEmail) {
      setAwaitingEmail(false);
      setIsLoading(true);
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

    // Consulta con Groq AI en /api/alfred/chat
    if (!user) {
      setMessages(prev => [
        ...prev,
        {
          sender: "alfred",
          text: "Para realizar consultas completas de Inteligencia Artificial con Alfred, por favor inicia sesión en la plataforma.",
          options: [{ label: "🏠 Menú principal", nextId: "start" }]
        }
      ]);
      return;
    }

    setIsThinking(true);
    setIsLoading(true);

    try {
      // Intentar streaming mediante SSE
      const response = await fetch(`${API_URL}/alfred/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: query,
          conversacionId: activeConversacionId,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.reply || "Error al conectar con el asistente de IA");
      }

      // Si la respuesta es un stream
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && response.body) {
        setIsThinking(false);
        let assistantText = "";

        // Agregar mensaje inicial vacío para streaming
        setMessages(prev => [...prev, { sender: "alfred", text: "", isStreaming: true }]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.chunk) {
                  assistantText += parsed.chunk;
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].sender === "alfred") {
                      updated[lastIdx] = {
                        ...updated[lastIdx],
                        text: assistantText,
                        isStreaming: true,
                      };
                    }
                    return updated;
                  });
                }
                if (parsed.conversacionId && !activeConversacionId) {
                  setActiveConversacionId(parsed.conversacionId);
                }
              } catch (_e) {}
            }
          }
        }

        // Finalizar streaming
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].sender === "alfred") {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: assistantText || "Respuesta recibida.",
              isStreaming: false,
            };
          }
          return updated;
        });

        // Actualizar lista de conversaciones
        fetchConversaciones();
      } else {
        // Modo JSON directo
        const data = await response.json();
        setIsThinking(false);
        if (data.conversacionId && !activeConversacionId) {
          setActiveConversacionId(data.conversacionId);
        }
        setMessages(prev => [
          ...prev,
          {
            sender: "alfred",
            text: data.reply || data.response || "Respuesta recibida.",
          }
        ]);
        fetchConversaciones();
      }
    } catch (err: any) {
      console.error("Error al consultar Groq AI:", err);
      setIsThinking(false);
      const errMsg = err?.message || "Error al conectar con el asistente de IA";
      setErrorMessage(errMsg);
      setMessages(prev => [
        ...prev,
        {
          sender: "alfred",
          text: `⚠️ **Aviso de conexión:** ${errMsg}\n\nPuede volver a intentarlo o seleccionar otra opción.`,
          options: [{ label: "🏠 Menú principal", nextId: "start" }]
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const resetChat = () => {
    setActiveConversacionId(null);
    setMessages([]);
    setCurrentNode("start");
    setAwaitingEmail(false);
    setInputText("");
    setErrorMessage(null);
    setShowHistoryDrawer(false);
    const node = TREE["start"];
    setTimeout(() => {
      setMessages([{ sender: "alfred", text: node.text, options: node.options }]);
    }, 80);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="alfred-toggle-button"
        aria-label="Abrir asistente Alfred"
        title="Alfred — Asistente EduTech con IA"
      >
        <i className="bx bx-bot" style={{ fontSize: "1.6rem" }}></i>
      </button>

      {isOpen && (
        <div className="alfred-chat-window">
          {/* Header */}
          <div className="alfred-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #38bdf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.05rem", boxShadow: "0 0 12px rgba(124, 58, 237, 0.5)"
              }}>🎩</div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Alfred</h3>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>
                  EduTech Hub • <span style={{ color: "#55ddf5", fontWeight: 600 }}>{activeModel}</span>
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {user && (
                <button
                  onClick={() => setShowHistoryDrawer(prev => !prev)}
                  className="alfred-close-button"
                  title="Historial de conversaciones"
                  style={{
                    background: showHistoryDrawer ? "rgba(121, 41, 210, 0.4)" : "rgba(255, 255, 255, 0.06)",
                    color: showHistoryDrawer ? "#55ddf5" : "#cbd5e1"
                  }}
                >
                  <i className="bx bx-history"></i>
                </button>
              )}

              <button
                onClick={resetChat}
                className="alfred-close-button"
                title="Nueva conversación"
              >
                <i className="bx bx-plus"></i>
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

          {/* Drawer de Historial de Conversaciones */}
          {showHistoryDrawer && (
            <div className="alfred-history-drawer">
              <div className="alfred-history-header">
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <i className="bx bx-conversation" style={{ color: "#7c3aed" }}></i> Tus conversaciones
                </span>
                <button
                  onClick={resetChat}
                  className="alfred-new-chat-btn"
                >
                  <i className="bx bx-plus"></i> Nueva
                </button>
              </div>

              <div className="alfred-history-list">
                {loadingConversaciones ? (
                  <p style={{ color: "#94a3b8", fontSize: "0.8rem", textAlign: "center", margin: "1rem 0" }}>
                    Cargando conversaciones...
                  </p>
                ) : conversaciones.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "0.8rem", textAlign: "center", margin: "1.5rem 0" }}>
                    No tienes conversaciones previas guardadas.
                  </p>
                ) : (
                  conversaciones.map(conv => (
                    <div
                      key={conv.id}
                      className={`alfred-history-item ${activeConversacionId === conv.id ? 'active' : ''}`}
                      onClick={() => handleSelectConversacion(conv.id)}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", overflow: "hidden" }}>
                        <span className="alfred-history-title">{conv.titulo}</span>
                        <span className="alfred-history-date">
                          {new Date(conv.actualizado_en).toLocaleDateString()} • {conv.total_mensajes || 0} msgs
                        </span>
                      </div>
                      <button
                        className="alfred-history-delete-btn"
                        onClick={(e) => handleDeleteConversacion(e, conv.id)}
                        title="Eliminar conversación"
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="alfred-messages">
            {messages.map((msg, index) => (
              <div key={index}>
                <div className={`alfred-message ${msg.sender}`}>
                  {msg.sender === "alfred" && (
                    <span style={{ fontSize: "1rem", marginRight: "0.35rem", flexShrink: 0, marginTop: "0.15rem" }}>🎩</span>
                  )}
                  {msg.sender === "alfred" ? (
                    <div style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(151, 71, 255, 0.15)",
                      borderRadius: "16px",
                      borderBottomLeftRadius: "4px",
                      padding: "0.75rem 1rem",
                      maxWidth: "85%",
                    }}>
                      <AlfredMarkdown content={msg.text} />
                    </div>
                  ) : (
                    <p style={{ whiteSpace: "pre-line", margin: 0 }}>{msg.text}</p>
                  )}
                </div>

                {/* Opciones interactivas rápidas */}
                {msg.sender === "alfred" && msg.options && index === messages.length - 1 && !isLoading && (
                  <div className="alfred-options">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        className="alfred-option-btn"
                        onClick={() => handleOption(opt)}
                      >
                        {opt.icon && <i className={`bx ${opt.icon}`}></i>}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Indicador de pensamiento */}
            {isThinking && (
              <div className="alfred-thinking-bubble">
                <span className="alfred-thinking-dot"></span>
                <span>Alfred está pensando...</span>
              </div>
            )}

            {/* Typing standard indicator */}
            {isLoading && !isThinking && (
              <div className="alfred-message alfred typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}

            {/* Error visual banner */}
            {errorMessage && (
              <div className="alfred-error-banner">
                <i className="bx bx-error-circle" style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "0.1rem" }}></i>
                <div>
                  <strong>Aviso:</strong> {errorMessage}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de entrada */}
          <form onSubmit={handleFreeInputSubmit} className="alfred-input-form">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={awaitingEmail ? "tu@correo.com" : "Pregúntale a Alfred (ej: ¿Qué es una red LAN?)..."}
              autoComplete="off"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              title="Enviar mensaje"
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
