#!/usr/bin/env node
/**
 * EduTechHub — Script de Limpieza de Base de Datos
 * ================================================
 * Elimina TODOS los datos de prueba/desarrollo manteniendo
 * la estructura de tablas íntegra, y recrea los dos
 * administradores definidos en el archivo .env del backend.
 *
 * USO:
 *   node clean_database.js           (interactivo — pide confirmación)
 *   node clean_database.js --yes     (sin confirmación, útil en CI/CD)
 *
 * NUNCA se ejecuta automáticamente al arrancar el servidor.
 */

const path = require('path');
const readline = require('readline');

// ─── Cargar variables de entorno ────────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ─── Importar dependencias vía CommonJS (el backend usa ts-node en runtime) ─
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
const DB_PATH = path.resolve(__dirname, '../database/edutechhub.sql');

// Administradores que deben quedar después del reset
const ADMIN_1_EMAIL = 'felipelucero534@gmail.com';
const ADMIN_1_NAME  = 'Felipe Lucero';

const ADMIN_2_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_2_NAME  = 'Administrador';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Donpatricio111';

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
  console.log('  🧹  EduTechHub — Limpieza de Base de Datos');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Este script eliminará TODOS los datos de la BD:');
  console.log('  • Usuarios (excepto los 2 admins)');
  console.log('  • Clases, trabajos, entregas, materiales');
  console.log('  • Mensajes, anuncios, notificaciones');
  console.log('  • Calificaciones, eventos, sesiones');
  console.log('  • Archivos en /uploads');
  console.log('');
  console.log('  Admins que quedarán:');
  console.log(`  ✅  ${ADMIN_1_EMAIL}`);
  if (ADMIN_2_EMAIL && ADMIN_2_EMAIL !== ADMIN_1_EMAIL) {
    console.log(`  ✅  ${ADMIN_2_EMAIL}`);
  }
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
      'entregas',
      'trabajos',
      'materiales',
      'notificaciones',
      'anuncios',
      'tablon_mensajes',
      'alumnos_clases',
      'clases',
      'calendario_notas',
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

    // 3. Reiniciar secuencias SQLite (sqlite_sequence)
    try {
      await db.run("DELETE FROM sqlite_sequence");
      console.log('  🔄 Secuencias de autoincremento reiniciadas');
    } catch (e) {
      console.warn(`  ⚠️  No se pudo reiniciar sqlite_sequence: ${e.message}`);
    }

    // 4. Recrear los dos administradores
    const SALT = 10;

    async function ensureAdmin(email, nombre) {
      if (!email) return;
      const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT);
      // DNI único basado en email para cumplir UNIQUE constraint
      const fakeDni = `ADM-${Buffer.from(email).toString('hex').slice(0, 8).toUpperCase()}`;
      await db.run(
        `INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, DNI)
         VALUES (?, ?, ?, 'admin', ?)`,
        [nombre, email.toLowerCase(), hash, fakeDni]
      );
      console.log(`  🔐 Admin recreado: ${email}`);
    }

    await ensureAdmin(ADMIN_1_EMAIL, ADMIN_1_NAME);
    if (ADMIN_2_EMAIL && ADMIN_2_EMAIL !== ADMIN_1_EMAIL.toLowerCase()) {
      await ensureAdmin(ADMIN_2_EMAIL, ADMIN_2_NAME);
    }

    await db.run('COMMIT');
    await db.run('PRAGMA foreign_keys = ON');
    // Compactar el archivo SQLite después del borrado masivo
    await db.run('VACUUM');

    console.log('\n  ✅ Base de datos limpia y lista.');

    // 5. Limpiar archivos de uploads
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
        console.log(`  🗑️  /uploads: ${count} archivo(s) eliminado(s)`);
      } catch (e) {
        console.warn(`  ⚠️  Error limpiando uploads: ${e.message}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🎉 EduTechHub está listo para distribución.');
    console.log('');
    console.log('  Credenciales de acceso:');
    console.log(`  📧 Email:      ${ADMIN_1_EMAIL}`);
    console.log(`  🔑 Contraseña: ${ADMIN_PASSWORD}`);
    if (ADMIN_2_EMAIL && ADMIN_2_EMAIL !== ADMIN_1_EMAIL.toLowerCase()) {
      console.log(`  📧 Email 2:    ${ADMIN_2_EMAIL}`);
    }
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
