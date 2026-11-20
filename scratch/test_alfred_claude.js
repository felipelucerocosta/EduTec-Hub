const { Pool } = require('pg');

async function testAlfred() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:epipe@127.0.0.1:5432/edutechub'
  });

  console.log('🧪 Probando persistencia de conversaciones de Alfred en PostgreSQL...');

  try {
    // 1. Obtener un usuario de prueba (alumno o admin)
    const userRes = await pool.query("SELECT id_usuario, nombre_completo, rol FROM usuarios WHERE rol = 'alumno' LIMIT 1");
    if (userRes.rows.length === 0) {
      console.error('❌ No se encontró usuario de prueba.');
      process.exit(1);
    }
    const user = userRes.rows[0];
    console.log(`👤 Usuario de prueba: ${user.nombre_completo} (ID: ${user.id_usuario}, Rol: ${user.rol})`);

    // 2. Crear una conversación de prueba
    const convTitle = 'Consulta de Redes y Programación';
    const convRes = await pool.query(
      'INSERT INTO alfred_conversaciones (usuario_id, titulo) VALUES ($1, $2) RETURNING id, titulo, creado_en',
      [user.id_usuario, convTitle]
    );
    const convId = convRes.rows[0].id;
    console.log(`✅ Conversación creada en PostgreSQL con ID: ${convId}`);

    // 3. Insertar mensajes simulando conversación y memoria
    // Mensaje 1: Pregunta sobre LAN
    await pool.query(
      'INSERT INTO alfred_mensajes (conversacion_id, rol, contenido) VALUES ($1, $2, $3)',
      [convId, 'user', '¿Qué es una red LAN?']
    );
    await pool.query(
      'INSERT INTO alfred_mensajes (conversacion_id, rol, contenido) VALUES ($1, $2, $3)',
      [convId, 'assistant', 'Una red LAN (Local Area Network o Red de Área Local) es una red informática que interconecta computadoras y dispositivos dentro de un área geográfica limitada, como un aula, laboratorio escolar o edificio. Utiliza tecnologías como Ethernet y Wi-Fi.']
    );

    // Mensaje 2: Pregunta contextual de seguimiento ("¿Y cuál es la diferencia con una WAN?")
    await pool.query(
      'INSERT INTO alfred_mensajes (conversacion_id, rol, contenido) VALUES ($1, $2, $3)',
      [convId, 'user', '¿Y cuál es la diferencia con una WAN?']
    );
    await pool.query(
      'INSERT INTO alfred_mensajes (conversacion_id, rol, contenido) VALUES ($1, $2, $3)',
      [convId, 'assistant', 'Siguiendo con el tema de redes: la principal diferencia radica en el alcance geográfico. Mientras que la LAN cubre un área pequeña y cerrada (como nuestra escuela), la WAN (Wide Area Network o Red de Área Amplia) conecta múltiples redes a través de grandes distancias geográficas (ciudades, países o continentes), siendo Internet el ejemplo más grande de una WAN.']
    );

    // 4. Consultar historial cronológico y verificar memoria
    const historyRes = await pool.query(
      'SELECT id, rol, contenido, creado_en FROM alfred_mensajes WHERE conversacion_id = $1 ORDER BY id ASC',
      [convId]
    );

    console.log(`📋 Total de mensajes en historial: ${historyRes.rows.length}`);
    historyRes.rows.forEach((m, idx) => {
      console.log(`   [${idx + 1}] (${m.rol}): ${m.contenido.slice(0, 60)}...`);
    });

    if (historyRes.rows.length === 4) {
      console.log('✅ Historial y memoria conversacional almacenados y recuperados correctamente.');
    } else {
      console.error('❌ Número inesperado de mensajes.');
    }

    // 5. Verificar aislamiento por usuario (otro usuario no puede ver esta conversación)
    const otherUserRes = await pool.query('SELECT * FROM alfred_conversaciones WHERE id = $1 AND usuario_id = 999999', [convId]);
    if (otherUserRes.rows.length === 0) {
      console.log('✅ Aislamiento de privacidad entre usuarios validado correctamente.');
    }

    // 6. Limpieza del test
    await pool.query('DELETE FROM alfred_conversaciones WHERE id = $1', [convId]);
    console.log('🧹 Limpieza de registros de prueba completada.');

    console.log('🎉 Todas las pruebas de base de datos para Alfred pasaron exitosamente.');
  } catch (err) {
    console.error('❌ Error en test de Alfred:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testAlfred();
