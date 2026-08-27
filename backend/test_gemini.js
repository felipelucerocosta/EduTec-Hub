const path = require('path');
const dotenv = require(path.join(__dirname, 'node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '.env') });
const axios = require(path.join(__dirname, 'node_modules/axios'));

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('GEMINI_API_KEY:', apiKey);

  // Test with header
  try {
    console.log('\n--- Testing with x-goog-api-key header ---');
    const res = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      { contents: [{ role: 'user', parts: [{ text: 'Hola' }] }] },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey } }
    );
    console.log('Header Test SUCCESS:', res.status, res.data);
  } catch (err) {
    console.log('Header Test ERROR:', err.response?.status, err.response?.data?.error?.message || err.message);
  }

  // Test with query param
  try {
    console.log('\n--- Testing with ?key= query param ---');
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { contents: [{ role: 'user', parts: [{ text: 'Hola' }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('Param Test SUCCESS:', res.status, res.data);
  } catch (err) {
    console.log('Param Test ERROR:', err.response?.status, err.response?.data?.error?.message || err.message);
  }
}

testGemini();
