const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const DB_PATH = path.resolve(__dirname, '../database/edutechhub.sql');

async function runCleanup() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🧹 EduTech-Hub — Limpieza Controlada de Cuentas de Prueba');
  console.log('════════════════════════════════════════════════════════════════\n');

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.run('PRAGMA foreign_keys = ON;');

  // 1. Identificar administradores (bajo ninguna circunstancia se tocan)
  const adminUsers = await db.all("SELECT id_usuario, correo, nombre_completo, rol, DNI FROM usuarios WHERE rol = 'admin'");
  console.log(`🔒 Administradores identificados para CONSERVAR (${adminUsers.length}):`);
  adminUsers.forEach(a => console.log(`   • [ID: ${a.id_usuario}] ${a.correo} (${a.nombre_completo}) - DNI: ${a.DNI}`));

  if (adminUsers.length === 0) {
    throw new Error('❌ ALERTA CRÍTICA: No se encontraron administradores. Abortando limpieza para prevenir pérdida de acceso.');
  }

  // 2. Identificar cuentas de prueba a eliminar (alumnos y profesores)
  const testUsers = await db.all("SELECT id_usuario, correo, nombre_completo, rol, DNI FROM usuarios WHERE rol != 'admin'");
  console.log(`\n🗑️  Cuentas de prueba no administrativas a ELIMINAR (${testUsers.length}):`);
  testUsers.forEach(u => console.log(`   • [ID: ${u.id_usuario}] ${u.correo} (${u.nombre_completo}) - Rol: ${u.rol} - DNI: ${u.DNI}`));

  if (testUsers.length === 0) {
    console.log('\n✨ No hay cuentas de prueba pendientes de eliminación.');
    await db.close();
    return;
  }

  const testUserIds = testUsers.map(u => u.id_usuario);
  const placeholders = testUserIds.map(() => '?').join(',');

  console.log('\n⏳ Ejecutando limpieza en transacción controlada...');
  await db.run('BEGIN TRANSACTION;');

  try {
    // 3. Desvincular comisiones y trabajos para conservar la estructura académica intacta
    const adminGeneralId = adminUsers[0].id_usuario;

    // Desvincular titular docente de las clases (quedan 'Sin Asignar' para nuevas asignaciones de la demo)
    const updateTitular = await db.run(`UPDATE clases SET titular_id = NULL WHERE titular_id IN (${placeholders})`, testUserIds);
    console.log(`   ✓ Clases desvinculadas de docentes de prueba: ${updateTitular.changes} modificadas (estructura intacta)`);

    // Asignar creador de clases al administrador institucional
    const updateCreador = await db.run(`UPDATE clases SET creador_id = ? WHERE creador_id IN (${placeholders})`, [adminGeneralId, ...testUserIds]);
    console.log(`   ✓ Creador de clases reasignado a Admin Institucional: ${updateCreador.changes}`);

    // Preservar trabajos prácticos asignando autoría al administrador institucional
    const updateTrabajos = await db.run(`UPDATE trabajos SET creado_por = ? WHERE creado_por IN (${placeholders})`, [adminGeneralId, ...testUserIds]);
    console.log(`   ✓ Trabajos prácticos preservados bajo supervisión Admin: ${updateTrabajos.changes}`);

    // Preservar materiales
    const updateMateriales = await db.run(`UPDATE materiales SET creado_por = ? WHERE creado_por IN (${placeholders})`, [adminGeneralId, ...testUserIds]);
    console.log(`   ✓ Materiales preservados: ${updateMateriales.changes}`);

    // 4. Eliminar datos transaccionales de alumnos y profesores de prueba
    await db.run(`DELETE FROM entrega_integrantes WHERE usuario_id IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM entregas WHERE alumno_id IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM profesores_clases WHERE profesor_id IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM alumnos_clases WHERE alumno_id IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM notificaciones WHERE usuario_id IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM anuncios WHERE autor_id IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM calendario_notas WHERE id_usuario IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM tablon_mensajes WHERE usuario_id IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM sesiones_simulador WHERE usuario_id IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM password_resets WHERE id_usuario IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM email_verifications WHERE user_id IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM auditoria_acceso WHERE usuario_id IN (${placeholders})`, testUserIds);

    // 5. Eliminar perfiles de alumno y profesor
    await db.run(`DELETE FROM alumno WHERE id_usuario IN (${placeholders})`, testUserIds);
    await db.run(`DELETE FROM profesor WHERE id_usuario IN (${placeholders})`, testUserIds);

    // 6. Eliminar usuarios de prueba de la tabla principal
    const delUsuarios = await db.run(`DELETE FROM usuarios WHERE id_usuario IN (${placeholders}) AND rol != 'admin'`, testUserIds);
    console.log(`   ✓ Cuentas de prueba eliminadas de 'usuarios': ${delUsuarios.changes}`);

    await db.run('COMMIT;');
    console.log('\n✅ Transacción confirmada exitosamente.');

    // 7. Verificación de integridad referencial
    const fkChecks = await db.all('PRAGMA foreign_key_check;');
    if (fkChecks.length > 0) {
      console.error('❌ Inconsistencias de Foreign Keys detectadas:', fkChecks);
      throw new Error('Integridad referencial violada.');
    } else {
      console.log('✅ Verificación de integridad referencial (PRAGMA foreign_key_check): 0 errores.');
    }

    // 8. Verificación de cuentas restantes
    const remainingUsers = await db.all('SELECT id_usuario, correo, nombre_completo, rol FROM usuarios');
    console.log(`\n📋 Cuentas activas en el sistema (${remainingUsers.length}):`);
    remainingUsers.forEach(u => console.log(`   • [ID: ${u.id_usuario}] ${u.correo} (${u.nombre_completo}) - Rol: ${u.rol}`));

    // 9. Verificación de clases y estructura académica
    const remainingClasses = await db.all('SELECT id, nombre, materia, seccion, codigo, titular_id FROM clases');
    console.log(`\n🏫 Clases académicas preservadas (${remainingClasses.length}):`);
    remainingClasses.forEach(c => console.log(`   • [${c.codigo}] ${c.nombre} (${c.seccion}) - Titular ID: ${c.titular_id || 'Sin Asignar'}`));

    console.log('\n🎉 Limpieza controlada finalizada con éxito.');
  } catch (err) {
    await db.run('ROLLBACK;');
    console.error('❌ Error durante la limpieza, transacción revertida (ROLLBACK):', err);
    throw err;
  } finally {
    await db.close();
  }
}

runCleanup().catch(err => {
  console.error(err);
  process.exit(1);
});

