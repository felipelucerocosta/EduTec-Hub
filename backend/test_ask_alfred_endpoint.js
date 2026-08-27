const path = require('path');
const axios = require(path.join(__dirname, 'node_modules/axios'));

async function testEndpoint() {
  console.log('Testing http://localhost:3001/api/ask-alfred ...');
  try {
    const res = await axios.post('http://localhost:3001/api/ask-alfred', {
      message: 'como te va'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('\n✅ RESPONSE STATUS:', res.status);
    console.log('✅ RESPONSE DATA:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('\n❌ RESPONSE STATUS:', err.response?.status);
    console.log('❌ RESPONSE DATA:', JSON.stringify(err.response?.data, null, 2));
  }
}

testEndpoint();
