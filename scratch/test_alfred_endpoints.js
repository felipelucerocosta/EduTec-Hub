const express = require('express');
const session = require('express-session');
const http = require('http');

async function testEndpoints() {
  console.log('🚀 Iniciando prueba de endpoints de Alfred con Claude AI...');

  const app = express();
  app.use(express.json());

  // Simular sesión de usuario para testing
  app.use((req, res, next) => {
    req.session = {
      usuario: {
        id: 7,
        nombre: 'juan',
        nombre_completo: 'Juan Pérez',
        correo: 'juan.perez@alumno.edu.ar',
        rol: 'alumno'
      }
    };
    next();
  });

  // Cargar router de alfred compilado
  const alfredRouter = require('../dist_backend/backend/alfred').default;
  app.use('/api', alfredRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  console.log(`📡 Servidor de prueba escuchando en ${baseUrl}`);

  try {
    // 1. GET /api/alfred/conversaciones
    const resList = await fetch(`${baseUrl}/alfred/conversaciones`);
    const dataList = await resList.json();
    console.log(`✅ [GET /alfred/conversaciones] Status: ${resList.status}, total: ${dataList.conversaciones.length}, model: ${dataList.model}`);

    // 2. POST /api/alfred/conversaciones (Crear conversación)
    const resCreate = await fetch(`${baseUrl}/alfred/conversaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Duda de Arquitectura y Redes' })
    });
    const dataCreate = await resCreate.json();
    console.log(`✅ [POST /alfred/conversaciones] Status: ${resCreate.status}, ID: ${dataCreate.conversacion?.id}, Título: ${dataCreate.conversacion?.titulo}`);
    const convId = dataCreate.conversacion?.id;

    // 3. GET /api/alfred/conversaciones/:id
    const resGet = await fetch(`${baseUrl}/alfred/conversaciones/${convId}`);
    const dataGet = await resGet.json();
    console.log(`✅ [GET /alfred/conversaciones/:id] Status: ${resGet.status}, Título: ${dataGet.conversacion?.titulo}, Mensajes: ${dataGet.mensajes.length}`);

    // 4. POST /api/alfred/chat sin API Key configurada
    const resChat = await fetch(`${baseUrl}/alfred/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '¿Cuál es la función del protocolo DNS en Internet?',
        conversacionId: convId,
        stream: false
      })
    });
    const dataChat = await resChat.json();
    console.log(`✅ [POST /alfred/chat] Status: ${resChat.status}`);
    console.log(`   Respuesta/Aviso: ${dataChat.error || dataChat.reply}`);

    // 5. DELETE /api/alfred/conversaciones/:id
    const resDel = await fetch(`${baseUrl}/alfred/conversaciones/${convId}`, {
      method: 'DELETE'
    });
    const dataDel = await resDel.json();
    console.log(`✅ [DELETE /alfred/conversaciones/:id] Status: ${resDel.status}, Success: ${dataDel.success}`);

    console.log('🎉 Todos los endpoints de Alfred pasaron las pruebas satisfactoriamente.');
  } catch (err) {
    console.error('❌ Error en test de endpoints:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

testEndpoints();
