const OpenAI = require('openai');
require('dotenv').config({ path: 'c:/Users/marti/EduTec-Hub/backend/.env', override: true });

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const candidates = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
  for (const m of candidates) {
    try {
      console.log(`Testing model: ${m}...`);
      const res = await client.chat.completions.create({
        model: m,
        messages: [
          { role: 'system', content: 'Eres Alfred, el asistente educativo de EduTech.' },
          { role: 'user', content: 'Hola Alfred, ¿estás funcionando? Responde brevemente en una sola frase en español.' }
        ],
        max_tokens: 100,
      });
      console.log(`SUCCESS with ${m}!`);
      console.log('Response:', res.choices[0]?.message?.content);
      return m;
    } catch (err) {
      console.error(`FAILED with ${m}:`, err.message);
    }
  }
}

testGroq();
