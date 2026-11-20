const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env'), override: true });
const { GroqService } = require('../dist_backend/backend/services/groqService');

async function testGroqEndToEnd() {
  console.log('--- TEST GROQ SERVICE INTEGRATION ---');
  console.log('Configured:', GroqService.isConfigured());
  console.log('Model:', GroqService.getModel());
  console.log('Display name:', GroqService.getModelDisplayName());

  try {
    const res = await GroqService.generateResponse({
      userId: 999999,
      messages: [
        { role: 'user', content: '¿Qué es una red LAN? Explícalo en 2 líneas.' }
      ],
      userRole: 'alumno',
      userName: 'Martín Test'
    });
    console.log('\n--- RESPUESTA DE ALFRED (GROQ) ---');
    console.log('Model used:', res.model);
    console.log('Reply:\n', res.reply);
    console.log('\nTEST COMPLETADO CON ÉXITO ✅');
  } catch (err) {
    console.error('TEST FALLÓ ❌:', err.message);
  }
}

testGroqEndToEnd();
