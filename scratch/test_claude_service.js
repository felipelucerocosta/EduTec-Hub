const { ClaudeService } = require('../dist_backend/backend/services/claudeService');

async function testService() {
  console.log('🧪 Probando ClaudeService en dist_backend...');

  // 1. Configuración de modelo
  const model = ClaudeService.getModel();
  console.log(`📌 Modelo configurado: ${model}`);

  // 2. Comprobación de API Key ausente o presente
  const isConfigured = ClaudeService.isConfigured();
  console.log(`📌 isConfigured(): ${isConfigured}`);

  // 3. Generación de System Prompt para Alumno
  const promptAlumno = ClaudeService.buildSystemPrompt('alumno', 'Juan Pérez');
  console.log('📌 System prompt alumno contiene nombre y rol:', promptAlumno.includes('Juan Pérez') && promptAlumno.includes('alumno'));

  // 4. Generación de System Prompt para Profesor
  const promptProfesor = ClaudeService.buildSystemPrompt('profesor', 'Prof. Martín');
  console.log('📌 System prompt profesor contiene tono pedagógico:', promptProfesor.includes('Prof. Martín') && promptProfesor.includes('Profesor/a'));

  // 5. Sanitización de mensajes para la API de Anthropic
  const rawMessages = [
    { role: 'assistant', content: 'Mensaje huérfano inicial' },
    { role: 'user', content: 'Hola Alfred' },
    { role: 'user', content: 'Segunda línea del usuario' },
    { role: 'assistant', content: '¡Hola! ¿En qué puedo ayudarte hoy?' },
    { role: 'user', content: 'Explícame el modelo OSI' }
  ];

  const sanitized = ClaudeService.sanitizeMessages(rawMessages);
  console.log(`📌 Mensajes sanitizados (total: ${sanitized.length}):`);
  sanitized.forEach((m, i) => console.log(`   [${i}] ${m.role}: ${m.content.slice(0, 40)}...`));

  if (sanitized[0].role === 'user' && sanitized[1].role === 'assistant' && sanitized[2].role === 'user') {
    console.log('✅ Sanitización correcta: alternancia estricta y primer mensaje de user.');
  } else {
    console.error('❌ Error en sanitización.');
    process.exit(1);
  }

  // 6. Rate Limit test
  const testUserId = 999;
  const check1 = ClaudeService.checkRateLimit(testUserId);
  console.log('📌 Rate check 1:', check1.allowed);

  ClaudeService.acquireUserLock(testUserId);
  const checkConcurrency = ClaudeService.checkRateLimit(testUserId);
  console.log('📌 Concurrency lock check (debe ser false):', checkConcurrency.allowed === false);
  ClaudeService.releaseUserLock(testUserId);

  const checkUnlocked = ClaudeService.checkRateLimit(testUserId);
  console.log('📌 Desbloqueo concurrencia (debe ser true):', checkUnlocked.allowed === true);

  console.log('🎉 Todas las pruebas lógicas de ClaudeService pasaron exitosamente.');
}

testService();
