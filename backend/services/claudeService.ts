import Anthropic from '@anthropic-ai/sdk';

// Configuración de límites y control de consumo
const MAX_CONCURRENT_REQUESTS_PER_USER = 1;
const MAX_REQUESTS_PER_MINUTE = 15;
const MAX_INPUT_CHARS = 8000;
const MAX_TOKENS_PER_RESPONSE = 4096;

// Estructura de mensajes compatible con Anthropic
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Rastreo de solicitudes activas y control de tasa (en memoria)
const activeUsers = new Set<number>();
const userRequestTimestamps = new Map<number, number[]>();

export class ClaudeService {
  private static client: Anthropic | null = null;

  /**
   * Obtiene la instancia del cliente Anthropic inicializada con la API Key configurada.
   */
  public static getClient(): Anthropic | null {
    const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    if (!apiKey) {
      return null;
    }
    if (!this.client) {
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * Verifica si el servicio de Claude está configurado con credenciales.
   */
  public static isConfigured(): boolean {
    const key = (process.env.ANTHROPIC_API_KEY || '').trim();
    return Boolean(key && key.length > 5);
  }

  /**
   * Obtiene el modelo configurado en variables de entorno o el predeterminado.
   */
  public static getModel(): string {
    return (process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022').trim();
  }

  /**
   * Sistema de rate limit y control de concurrencia por usuario.
   */
  public static checkRateLimit(userId: number): { allowed: boolean; reason?: string } {
    // 1. Concurrencia simultánea
    if (activeUsers.has(userId)) {
      return {
        allowed: false,
        reason: 'Ya hay una respuesta en curso para tu cuenta. Espera a que termine.'
      };
    }

    // 2. Límite de solicitudes por minuto (sliding window)
    const now = Date.now();
    const timestamps = userRequestTimestamps.get(userId) || [];
    const recent = timestamps.filter((t) => now - t < 60000);

    if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de consultas por minuto (${MAX_REQUESTS_PER_MINUTE}/min). Por favor espera un momento.`
      };
    }

    recent.push(now);
    userRequestTimestamps.set(userId, recent);
    return { allowed: true };
  }

  public static acquireUserLock(userId: number) {
    activeUsers.add(userId);
  }

  public static releaseUserLock(userId: number) {
    activeUsers.delete(userId);
  }

  /**
   * Genera el prompt de sistema con la identidad educativa de Alfred.
   */
  public static buildSystemPrompt(userRole: string = 'alumno', userName: string = 'Usuario'): string {
    const rolDescripcion =
      userRole === 'profesor' || userRole === 'admin'
        ? `Estás conversando con ${userName}, quien es ${userRole === 'admin' ? 'Administrador' : 'Profesor/a'} en la institución. Mantén un tono formal, colaborativo, pedagógico y analítico. Puedes ayudar con preparación de clases, rúbricas de evaluación, diseño de consignas, ejercicios técnicos y análisis didáctico.`
        : `Estás conversando con el/la alumno/a ${userName}. Sé paciente, didáctico, claro y motivador. Explica los conceptos paso a paso, usando ejemplos cotidianos cuando ayuden a comprender. Si te pide resolver un ejercicio, explica el razonamiento y método en lugar de dar solo el resultado directo.`;

    return `Eres Alfred 🎩, el asistente de inteligencia artificial oficial de EduTech (Sistema de Gestión Educativa para Escuelas Técnicas e Institutos).

IDENTIDAD Y PERSONALIDAD:
- Tu nombre es Alfred. Eres inteligente, profesional, paciente, natural y didáctico.
- Te comunicas siempre en español por defecto con un lenguaje educado y cordial (usando "usted" o un "tú" respetuoso y cercano según el contexto escolar). Si el usuario te habla en otro idioma (inglés, portugués, etc.), responde con fluidez en ese idioma.
- ${rolDescripcion}

ÁREAS DE ESPECIALIZACIÓN ACADÉMICA Y TÉCNICA:
1. Ciencias Exactas y Naturales: Matemáticas, física, química, estadística y biología.
2. Programación y Software: HTML, CSS, JavaScript, TypeScript, Python, C/C++, Java, bases de datos (SQL, PostgreSQL, MySQL), Git y arquitectura de software.
3. Informática, Redes y Telecomunicaciones: Modelo OSI, TCP/IP, redes LAN, MAN, WAN, VLAN, direccionamiento IPv4/IPv6, subredes, enrutamiento, conmutación, protocolos (HTTP, DNS, DHCP, SSH) y ciberseguridad desde un enfoque estrictamente educativo y ético.
4. Redacción y Lengua: Organización de textos, resúmenes, ensayos, comprensión lectora y ortografía.
5. Apoyo Pedagógico: Planificación docente, guías de estudio y diseño de actividades.

REGLAS DE FORMATO Y ESTILO:
- Utiliza formato Markdown completo y prolijo:
  - Títulos estructurados (##, ###).
  - Negritas para conceptos clave y listas para pasos o comparaciones.
  - Bloques de código con el lenguaje especificado (ej: \`\`\`python, \`\`\`typescript, \`\`\`sql) para cualquier fragmento de programación.
  - Para fórmulas matemáticas, utiliza notación clara o LaTeX delimitado por $ o $$ (ej: $E = mc^2$, $v = \\frac{d}{t}$).
- Mantén un rigor conceptual absoluto: distingue siempre entre hechos comprobados y suposiciones. Si no tienes datos suficientes o no estás seguro de algo, reconócelo con honestidad.
- No fomentes ni generes contenido malicioso, trampas académicas ni vulnerabilidades informáticas. Si te consultan sobre seguridad o redes, enfócate en la defensa, comprensión teórica y buenas prácticas educativas.`;
  }

  /**
   * Sanitiza y prepara la lista de mensajes para el formato que exige Anthropic:
   * - Alternancia estricta entre user y assistant.
   * - El primer mensaje debe ser de 'user'.
   */
  public static sanitizeMessages(messages: ClaudeMessage[]): ClaudeMessage[] {
    if (!messages || messages.length === 0) {
      return [];
    }

    const filtered: ClaudeMessage[] = [];

    for (const m of messages) {
      const text = (m.content || '').trim();
      if (!text) continue;

      const role: 'user' | 'assistant' = m.role === 'assistant' ? 'assistant' : 'user';

      if (filtered.length > 0 && filtered[filtered.length - 1].role === role) {
        // Combinar mensajes consecutivos del mismo rol
        filtered[filtered.length - 1].content += `\n\n${text}`;
      } else {
        filtered.push({ role, content: text });
      }
    }

    // Asegurar que el primer mensaje sea del usuario
    while (filtered.length > 0 && filtered[0].role !== 'user') {
      filtered.shift();
    }

    return filtered;
  }

  /**
   * Envía una consulta completa y devuelve la respuesta en texto.
   */
  public static async generateResponse(options: {
    userId: number;
    messages: ClaudeMessage[];
    userRole?: string;
    userName?: string;
  }): Promise<{ reply: string; model: string; inputTokens?: number; outputTokens?: number }> {
    const { userId, messages, userRole, userName } = options;

    const rateCheck = this.checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.reason);
    }

    const client = this.getClient();
    if (!client) {
      throw new Error('CONFIG_ERROR: Clave de API de Anthropic no configurada en el servidor (ANTHROPIC_API_KEY ausente).');
    }

    const sanitized = this.sanitizeMessages(messages);
    if (sanitized.length === 0) {
      throw new Error('Debes proporcionar al menos un mensaje válido para consultar a Alfred.');
    }

    // Validar tamaño del último mensaje
    const lastMsg = sanitized[sanitized.length - 1];
    if (lastMsg.content.length > MAX_INPUT_CHARS) {
      throw new Error(`El mensaje supera el límite permitido (${MAX_INPUT_CHARS} caracteres). Por favor envía una consulta más concisa.`);
    }

    const model = this.getModel();
    const systemPrompt = this.buildSystemPrompt(userRole, userName);

    this.acquireUserLock(userId);
    try {
      const response = await client.messages.create({
        model,
        max_tokens: MAX_TOKENS_PER_RESPONSE,
        system: systemPrompt,
        messages: sanitized,
      });

      let reply = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          reply += block.text;
        }
      }

      return {
        reply: reply || 'Alfred no pudo generar una respuesta de texto.',
        model: response.model || model,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      };
    } catch (error: any) {
      throw this.handleAnthropicError(error);
    } finally {
      this.releaseUserLock(userId);
    }
  }

  /**
   * Envía una consulta con soporte de streaming progresivo para respuestas en vivo.
   */
  public static async streamResponse(options: {
    userId: number;
    messages: ClaudeMessage[];
    userRole?: string;
    userName?: string;
    onChunk: (chunk: string) => void;
  }): Promise<{ fullText: string; model: string; inputTokens?: number; outputTokens?: number }> {
    const { userId, messages, userRole, userName, onChunk } = options;

    const rateCheck = this.checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.reason);
    }

    const client = this.getClient();
    if (!client) {
      throw new Error('CONFIG_ERROR: Clave de API de Anthropic no configurada en el servidor (ANTHROPIC_API_KEY ausente).');
    }

    const sanitized = this.sanitizeMessages(messages);
    if (sanitized.length === 0) {
      throw new Error('Debes proporcionar al menos un mensaje válido.');
    }

    const lastMsg = sanitized[sanitized.length - 1];
    if (lastMsg.content.length > MAX_INPUT_CHARS) {
      throw new Error(`El mensaje supera el límite permitido (${MAX_INPUT_CHARS} caracteres).`);
    }

    const model = this.getModel();
    const systemPrompt = this.buildSystemPrompt(userRole, userName);

    this.acquireUserLock(userId);
    try {
      const stream = await client.messages.stream({
        model,
        max_tokens: MAX_TOKENS_PER_RESPONSE,
        system: systemPrompt,
        messages: sanitized,
      });

      let fullText = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const textChunk = event.delta.text;
          fullText += textChunk;
          onChunk(textChunk);
        }
      }

      const finalMessage = await stream.finalMessage();

      return {
        fullText,
        model: finalMessage.model || model,
        inputTokens: finalMessage.usage?.input_tokens,
        outputTokens: finalMessage.usage?.output_tokens,
      };
    } catch (error: any) {
      throw this.handleAnthropicError(error);
    } finally {
      this.releaseUserLock(userId);
    }
  }

  /**
   * Manejo y traducción amigable de errores de Anthropic SDK.
   */
  private static handleAnthropicError(error: any): Error {
    const status = error?.status;
    const msg = error?.message || '';

    console.error(`❌ [ClaudeService] Error de Anthropic API (${status || 'Network'}):`, msg);

    if (status === 401 || msg.includes('401') || msg.includes('invalid x-api-key') || msg.includes('authentication')) {
      return new Error('AUTH_ERROR: La clave de API de Anthropic (ANTHROPIC_API_KEY) no es válida o ha caducado.');
    }

    if (status === 404) {
      return new Error(`MODEL_NOT_FOUND: El modelo '${this.getModel()}' no se encuentra disponible.`);
    }

    if (status === 429 || msg.includes('429') || msg.includes('rate_limit')) {
      return new Error('RATE_LIMIT: Se ha alcanzado el límite de solicitudes o cuota de la API de Claude. Por favor intenta en unos minutos.');
    }

    if (status >= 500) {
      return new Error('UPSTREAM_ERROR: Los servidores de Anthropic experimentan demoras. Por favor reintenta en breve.');
    }

    return new Error(msg || 'Error de comunicación con el servicio de Claude AI.');
  }
}

export default ClaudeService;
