const path = require('path');
const dotenv = require(path.join(__dirname, 'node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '.env') });
const axios = require(path.join(__dirname, 'node_modules/axios'));

async function testAqKeyWithModel() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  console.log('Testing key:', apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : 'NONE');

  const modelsToTest = [
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp'
  ];

  const payload = {
    contents: [{ role: 'user', parts: [{ text: 'Hola, di solamente la palabra OK' }] }]
  };

  for (const model of modelsToTest) {
    console.log(`\n=== Testing model: ${model} ===`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        }
      });
      console.log('🎉 SUCCESS WITH MODEL:', model, 'STATUS:', res.status);
      console.log('RESPONSE:', JSON.stringify(res.data, null, 2));
      return;
    } catch (err) {
      console.log('❌ FAILED FOR MODEL', model, ':', err.response?.status, err.response?.data?.error?.message || err.message);
    }
  }
}

testAqKeyWithModel();
