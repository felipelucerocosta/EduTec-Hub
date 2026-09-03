#!/usr/bin/env node
/**
 * EduTechHub — Script de Limpieza de Base de Datos para Testing
 * =============================================================
 * Elimina TODOS los datos manteniendo la estructura de tablas,
 * y recrea exactamente 4 cuentas de testing documentadas.
 *
 * USO:
 *   node clean_database.js           (interactivo — pide confirmación)
 *   node clean_database.js --yes     (sin confirmación, útil en CI/CD)
 */

const path = require('path');
const readline = require('readline');

// ─── Cargar variables de entorno ────────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ─── Importar dependencias ───────────────────────────────────────────────────
let sqlite3, sqliteOpen, bcrypt;
try {
  sqlite3 = require('sqlite3').verbose();
  sqliteOpen = require('sqlite').open;
  bcrypt = require('bcrypt');
} catch (e) {
  console.error('❌ Dependencias faltantes. Ejecuta: cd backend && npm install');
  process.exit(1);
}

// ─── Config ─────────────────────────────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../database/edutechhub.sql');

// ══════════════════════════════════════════════════════════════════
// CUENTAS DE TESTING — Modificar aquí si es necesario
// ══════════════════════════════════════════════════════════════════
const TESTING_ACCOUNTS = [
  // Admin General
  {
    type: 'admin',
    nombre: 'Administrador General',
    email: 'admin@edutechhub.edu.ar',
    password: 'Donpatricio111',
    dni: 'ADM-OWNER-001'
  },
  // Admin 2: Testing adicional
  {
    type: 'admin',
    nombre: 'Administrador Testing',
    email: (process.env.ADMIN_EMAIL || 'admin.test@tecnica29de6.edu.ar').trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Donpatricio11123',
    dni: 'ADM-TEST-002'
  },
  // Profesor de prueba
  {
    type: 'profesor',
    nombre: 'Profesor Técnico',
    email: 'profesor.prueba@tecnica29de6.edu.ar',
    password: '12345678',
    dni: 'PROF-TEST-001',
    materia: 'Tecnología'
  },
  // Alumno de prueba
  {
    type: 'alumno',
    nombre: 'Alumno de Prueba',
    email: 'alumno.prueba@tecnica29de6.edu.ar',
    password: '123456789',
    dni: 'ALU-TEST-001',
    curso: '3ro A'
  }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function openDb() {
  return sqliteOpen({ filename: DB_PATH, driver: sqlite3.Database });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const skipConfirm = process.argv.includes('--yes');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🧹  EduTechHub — Limpieza + Setup Testing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Se borrarán TODOS los datos y se crearán:');
  TESTING_ACCOUNTS.forEach(acc => {
    console.log(`  ✅  [${acc.type.toUpperCase()}] ${acc.email} — contraseña: ${acc.password}`);
  });
  console.log('');

  if (!skipConfirm) {
    const answer = await ask('  ¿Confirmar limpieza? Escribe "LIMPIAR" para continuar: ');
    if (answer.trim() !== 'LIMPIAR') {
      console.log('\n  ⚠️  Operación cancelada.\n');
      process.exit(0);
    }
  }

  console.log('\n  🔄 Iniciando limpieza...\n');

  const db = await openDb();
  await db.run('PRAGMA foreign_keys = OFF');
  await db.run('BEGIN TRANSACTION');

  try {
    // 1. Borrar datos en orden (hijos antes que padres)
    const tables = [
      'password_resets',
      'email_verifications',
      'entrega_integrantes',
      'entregas',
      'trabajos',
      'materiales',
      'notificaciones',
      'anuncios',
      'tablon_mensajes',
      'alumnos_clases',
      'clases',
      'calendario_notas',
      'sesiones_simulador',
      'actas',
      'alumno',
      'profesor',
    ];

    for (const table of tables) {
      try {
        const result = await db.run(`DELETE FROM ${table}`);
        console.log(`  🗑️  ${table}: ${result.changes ?? 0} filas eliminadas`);
      } catch (e) {
        console.warn(`  ⚠️  No se pudo limpiar "${table}": ${e.message}`);
      }
    }

    // 2. Borrar TODOS los usuarios
    await db.run('DELETE FROM usuarios');
    console.log('  🗑️  usuarios: todos eliminados');

    // 3. Reiniciar secuencias de autoincremento
    try {
      await db.run('DELETE FROM sqlite_sequence');
      console.log('  🔄 Secuencias de autoincremento reiniciadas');
    } catch (e) {
      console.warn(`  ⚠️  No se pudo reiniciar sqlite_sequence: ${e.message}`);
    }

    // 4. Crear las 4 cuentas de testing
    console.log('\n  👤 Creando cuentas de testing...\n');
    const SALT = 10;

    const createdIds = {};

    for (const acc of TESTING_ACCOUNTS) {
      // Saltar admin 2 si tiene el mismo email que admin 1
      if (acc === TESTING_ACCOUNTS[1] && acc.email === TESTING_ACCOUNTS[0].email) {
        console.log(`  ⏭️  Admin 2 tiene el mismo email que Admin 1, omitido.`);
        continue;
      }

      const hash = await bcrypt.hash(acc.password, SALT);

      const result = await db.run(
        `INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, DNI, curso)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [acc.nombre, acc.email, hash, acc.type, acc.dni, acc.curso || null]
      );
      const userId = result.lastID;
      createdIds[acc.type + '_' + acc.email] = userId;

      // Para alumnos, también insertar en tabla alumno
      if (acc.type === 'alumno') {
        const cursoRes = await db.get(`SELECT id_curso FROM curso WHERE nombre_curso = ?`, ['3ro 1ra']);
        const idCurso = cursoRes ? cursoRes.id_curso : null;
        await db.run(
          `INSERT INTO alumno (DNI, nombre_completo, apellido, id_curso, id_usuario, correo, contrasena)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [acc.dni, 'Alumno', 'de Prueba', idCurso, userId, acc.email, hash]
        );
      }

      // Para profesores, también insertar en tabla profesor
      if (acc.type === 'profesor') {
        await db.run(
          `INSERT INTO profesor (id_usuario, correo, DNI, nombre_completo, materia, contrasena)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, acc.email, acc.dni, acc.nombre, acc.materia || '', hash]
        );
      }

      console.log(`  ✅  [${acc.type.toUpperCase()}] Creado: ${acc.email} (ID: ${userId})`);
    }

    // 5. Crear una clase de testing y asignar al profesor
    const profesorId = createdIds['profesor_profe.test@edutechhub.test'];
    const alumnoId   = createdIds['alumno_alumno.test@edutechhub.test'];

    if (profesorId && alumnoId) {
      const claseResult = await db.run(
        `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Programación 3ro A', '3ro A', 'Programación', 'Laboratorio 1', 'Profesor de Prueba', profesorId, profesorId, 'PROG-TEST-2026']
      );
      const claseId = claseResult.lastID;

      // Inscribir al alumno en la clase
      await db.run(
        `INSERT INTO alumnos_clases (alumno_id, materia, codigo)
         VALUES (?, ?, ?)`,
        [alumnoId, 'Programación', 'PROG-TEST-2026']
      );

      console.log(`\n  🏫  Clase de testing creada: "Programación 3ro A" (ID: ${claseId}, código: PROG-TEST-2026)`);
      console.log(`  👩‍🏫  Profesor asignado: Profesor de Prueba`);
      console.log(`  🎓  Alumno inscripto: Alumno de Prueba`);
    }

    await db.run('COMMIT');
    await db.run('PRAGMA foreign_keys = ON');
    await db.run('VACUUM');

    // 6. Limpiar archivos de uploads
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const fs = require('fs');
    if (fs.existsSync(uploadsDir)) {
      let count = 0;
      function clearDir(dir) {
        for (const entry of fs.readdirSync(dir)) {
          const full = path.join(dir, entry);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            clearDir(full);
            try { fs.rmdirSync(full); } catch (_) {}
          } else {
            fs.unlinkSync(full);
            count++;
          }
        }
      }
      try {
        clearDir(uploadsDir);
        console.log(`\n  🗑️  /uploads: ${count} archivo(s) eliminado(s)`);
      } catch (e) {
        console.warn(`  ⚠️  Error limpiando uploads: ${e.message}`);
      }
    }

    // 7. Resumen final con credenciales
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🎉 EduTechHub — Entorno de Testing Listo');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('  CREDENCIALES DE TESTING:');
    console.log('');
    TESTING_ACCOUNTS.forEach(acc => {
      const label = acc === TESTING_ACCOUNTS[1] && acc.email === TESTING_ACCOUNTS[0].email
        ? '(omitido - mismo email que Admin 1)'
        : `contraseña: ${acc.password}`;
      console.log(`  [${acc.type.toUpperCase().padEnd(8)}] ${acc.email.padEnd(40)} ${label}`);
    });
    console.log('');
    console.log('  CLASE DE TESTING:');
    console.log('  📚 Nombre:  Programación 3ro A');
    console.log('  🔑 Código:  PROG-TEST-2026');
    console.log('');
    console.log('  Ver TESTING_CREDENTIALS.md para flujo completo.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    await db.run('ROLLBACK');
    console.error('\n  ❌ Error durante la limpieza:', err.message);
    console.error('  La base de datos fue revertida al estado anterior.\n');
    process.exit(1);
  } finally {
    await db.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
