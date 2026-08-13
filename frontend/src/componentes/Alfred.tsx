import React, { useState, useRef, useEffect } from "react";
import "../alfred.css";

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
    text: "¡Buenas! Soy Alfred 🎩, el asistente de Edutech. ¿En qué le puedo ayudar hoy?",
    options: [
      { label: "🔑 Problemas con mi cuenta", icon: "bx-key", nextId: "cuenta" },
      { label: "📚 Cómo usar la plataforma", icon: "bx-help-circle", nextId: "plataforma" },
      { label: "🏫 Clases y materias", icon: "bx-book", nextId: "clases" },
      { label: "📅 Calendario y foro", icon: "bx-calendar", nextId: "calendario" },
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
    text: "Por favor, ingrese su dirección de correo electrónico registrada y le enviamos el enlace.",
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
    text: "Puede ingresar con cualquier correo electrónico válido (Gmail, Outlook, etc.). ¿El error que le aparece es...?",
    options: [
      { label: "❌ 'Credenciales incorrectas'", nextId: "credenciales_incorrectas" },
      { label: "🚫 'Usuario no encontrado'", nextId: "usuario_no_encontrado" },
      { label: "⚠️ Error del servidor", nextId: "error_servidor" },
      { label: "← Volver", nextId: "cuenta" },
    ],
  },

  credenciales_incorrectas: {
    id: "credenciales_incorrectas",
    text: "Si aparece 'credenciales incorrectas', significa que el correo o la contraseña no coinciden. Verifique:\n\n• Que esté usando el correo con el que se registró\n• Que la contraseña no tenga espacios de más\n• Que MAYÚSCULAS y minúsculas sean correctas\n\nSi olvidó la contraseña, puedo ayudarle a recuperarla.",
    options: [
      { label: "🔑 Recuperar contraseña", nextId: "olvide_password" },
      { label: "✅ Voy a intentarlo", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  usuario_no_encontrado: {
    id: "usuario_no_encontrado",
    text: "Si su correo no está registrado en el sistema, deberá crear una cuenta nueva. Desde la pantalla de login, seleccione la pestaña 'Crear Cuenta'.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  error_servidor: {
    id: "error_servidor",
    text: "Un error del servidor es algo que debemos reportar. Puede intentar:\n\n• Refrescar la página y volver a intentar\n• Esperar unos minutos\n• Contactar al administrador: felipelucero534@gmail.com",
    options: [
      { label: "📧 Anotado, gracias", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  cuenta_bloqueada: {
    id: "cuenta_bloqueada",
    text: "Las cuentas pueden bloquearse temporalmente tras varios intentos de acceso fallidos (más de 3 intentos en 15 minutos). En ese caso:\n\n• Espere 15 minutos e intente de nuevo\n• O recupere su contraseña para desbloquear el acceso inmediatamente",
    options: [
      { label: "🔑 Recuperar contraseña", nextId: "olvide_password" },
      { label: "⏱️ Esperaré 15 min", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  cambiar_datos: {
    id: "cambiar_datos",
    text: "Actualmente los cambios de datos personales deben ser gestionados por el administrador del sistema. Por favor, contacte a:\n\n📧 felipelucero534@gmail.com\n\nIndique su nombre completo y el cambio que necesita realizar.",
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
    text: "Para registrarse:\n\n1️⃣ Vaya a la página principal y haga clic en 'Comenzar ahora'\n2️⃣ Seleccione la pestaña 'Crear Cuenta'\n3️⃣ Elija su rol: Alumno o Profesor\n4️⃣ Complete nombre, correo, DNI y contraseña\n5️⃣ ¡Listo! Inicie sesión con sus credenciales",
    options: [
      { label: "✅ Claro, gracias", nextId: "cierre" },
      { label: "❓ Tengo otro problema", nextId: "plataforma" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  como_clases: {
    id: "como_clases",
    text: "Para acceder a sus clases:\n\n👨‍🎓 Si es Alumno: vaya a 'Mis Clases', busque su materia y haga clic en la tarjeta para entrar.\n\n👨‍🏫 Si es Profesor: vaya a 'Panel de Clases', sus clases aparecen listadas. Haga clic en una tarjeta para gestionar trabajos y alumnos.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "📚 Más sobre clases", nextId: "clases" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  como_trabajo: {
    id: "como_trabajo",
    text: "Para ver los trabajos asignados:\n\n1️⃣ Ingrese a una clase desde 'Mis Clases'\n2️⃣ Dentro de la clase verá la sección 'Trabajos y Materiales'\n3️⃣ Haga clic en un trabajo para ver sus detalles\n\n⚠️ Los trabajos aparecen solo cuando el docente los publica.",
    options: [
      { label: "✅ Perfecto", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  como_calendario: {
    id: "como_calendario",
    text: "El calendario está disponible dentro de cada clase. Desde el menú de navegación superior, verá el enlace 'Calendario' cuando esté dentro de una clase.\n\nAllí puede ver y agregar recordatorios de tareas y eventos importantes.",
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
      { label: "👥 Sobre alumnos inscriptos", nextId: "alumnos_inscriptos" },
      { label: "📄 Sobre materiales", nextId: "sobre_materiales" },
      { label: "← Volver", nextId: "start" },
    ],
  },

  como_unirse: {
    id: "como_unirse",
    text: "Para unirse a una clase necesita el código de acceso que le provee su docente.\n\n1️⃣ Vaya a 'Mis Clases'\n2️⃣ Haga clic en 'Unirse a una Clase'\n3️⃣ Ingrese el nombre de la materia y el código\n4️⃣ ¡Listo! La clase aparecerá en su listado",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "❓ No tengo el código", nextId: "sin_codigo" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  sin_codigo: {
    id: "sin_codigo",
    text: "Si no tiene el código de acceso, debe solicitárselo a su docente. El código es generado automáticamente cuando el profesor crea la clase y aparece en la tarjeta de la clase (visible para el docente).",
    options: [
      { label: "✅ Gracias", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  no_veo_clases: {
    id: "no_veo_clases",
    text: "Si no ve sus clases, pruebe lo siguiente:\n\n1️⃣ Haga clic en 'Sincronizar' en el Panel de Clases\n2️⃣ Verifique que esté usando la cuenta correcta\n3️⃣ Si es alumno, asegúrese de haberse unido con el código\n4️⃣ Si es profesor, sus clases deben aparecer automáticamente",
    options: [
      { label: "✅ Voy a intentarlo", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  alumnos_inscriptos: {
    id: "alumnos_inscriptos",
    text: "La sección de 'Alumnos Inscriptos' solo es visible para el docente titular de la clase. Aparece con los alumnos que hayan sido aprobados.\n\nSi es docente y no ve alumnos, significa que aún no hay solicitudes aprobadas.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  sobre_materiales: {
    id: "sobre_materiales",
    text: "Los materiales y trabajos son publicados por el docente dentro de cada clase. Como alumno, los verá en la sección 'Trabajos y Materiales' al ingresar a una clase.\n\n⚠️ Si la sección está vacía, el docente aún no ha publicado nada.",
    options: [
      { label: "✅ Entendido", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  // ── CALENDARIO ─────────────────────────────────────────────────────────────
  calendario: {
    id: "calendario",
    text: "¿Qué necesita saber sobre el Calendario o el Foro?",
    options: [
      { label: "📅 Cómo agregar un recordatorio", nextId: "agregar_recordatorio" },
      { label: "💬 Cómo usar el foro", nextId: "usar_foro" },
      { label: "← Volver", nextId: "start" },
    ],
  },

  agregar_recordatorio: {
    id: "agregar_recordatorio",
    text: "Para agregar un recordatorio al calendario:\n\n1️⃣ Ingrese a una clase\n2️⃣ Haga clic en 'Calendario' en el menú superior\n3️⃣ Seleccione la fecha deseada\n4️⃣ Complete el título y descripción\n5️⃣ Guarde el recordatorio\n\nSolo usted verá sus propios recordatorios.",
    options: [
      { label: "✅ Perfecto", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  usar_foro: {
    id: "usar_foro",
    text: "El Foro es un espacio de consultas dentro de cada clase. Desde allí puede:\n\n• Publicar preguntas o comentarios\n• Ver los mensajes del docente y compañeros\n• Es accesible desde el menú 'Foro' dentro de una clase",
    options: [
      { label: "✅ Gracias", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  // ── OTRO ──────────────────────────────────────────────────────────────────
  otro: {
    id: "otro",
    text: "Entiendo. Para temas no contemplados en este asistente, puede contactar directamente con el equipo de Edutech:\n\n📧 felipelucero534@gmail.com\n\nDescriba su consulta y recibirá una respuesta a la brevedad.",
    options: [
      { label: "👍 Gracias", nextId: "cierre" },
      { label: "🏠 Menú principal", nextId: "start" },
    ],
  },

  // ── CIERRE ────────────────────────────────────────────────────────────────
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
    text: "¡Hasta luego! Que tenga un excelente día. Estaré aquí si necesita algo. 🎩",
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
  isInput?: boolean;
}

// ─── Componente ────────────────────────────────────────────────────────────
const Alfred: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [, setCurrentNode] = useState<string>("start");
  const [messages, setMessages] = useState<Message[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Iniciar con el nodo de inicio cuando se abre
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const node = TREE["start"];
      setMessages([{ sender: "alfred", text: node.text, options: node.options }]);
      setCurrentNode("start");
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    }
  };

  const handleOption = (option: Option) => {
    // Agregar el mensaje del usuario
    setMessages(prev => [...prev, { sender: "user", text: option.label }]);
    // Navegar al siguiente nodo con delay para simular que Alfred "escribe"
    setIsLoading(true);
    setTimeout(() => {
      addAlfredMessage(option.nextId);
      setIsLoading(false);
    }, 500);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const email = emailInput.trim();
    setMessages(prev => [...prev, { sender: "user", text: email }]);
    setEmailInput("");
    setAwaitingEmail(false);
    setIsLoading(true);

    try {
      await fetch("http://localhost:3001/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email }),
      });
      setIsLoading(false);
      addAlfredMessage("reset_enviado");
    } catch {
      setIsLoading(false);
      addAlfredMessage("reset_error");
    }
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentNode("start");
    setAwaitingEmail(false);
    setEmailInput("");
    const node = TREE["start"];
    setTimeout(() => {
      setMessages([{ sender: "alfred", text: node.text, options: node.options }]);
    }, 100);
  };

  return (
    <>
      {/* Toggle button */}
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
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>Asistente Edutech</p>
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

                {/* Options — only show on the LAST alfred message */}
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

            {/* Typing indicator */}
            {isLoading && (
              <div className="alfred-message alfred typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Email input (only when needed) */}
          {awaitingEmail && !isLoading && (
            <form onSubmit={handleEmailSubmit} className="alfred-input-form">
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="off"
                required
                autoFocus
              />
              <button type="submit" disabled={!emailInput.trim()}>
                <i className="bx bx-send"></i>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default Alfred;