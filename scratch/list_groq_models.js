const OpenAI = require('openai');
require('dotenv').config({ path: 'c:/Users/marti/EduTec-Hub/backend/.env', override: true });

async function listModels() {
  const apiKey = process.env.GROQ_API_KEY;
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  try {
    const models = await client.models.list();
    console.log('Available models:');
    models.data.forEach(m => console.log(' - ' + m.id));
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

listModels();
