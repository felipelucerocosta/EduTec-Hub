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
// CUENTAS DE TESTING — Multi-rol y Multi-división
// ══════════════════════════════════════════════════════════════════
const TESTING_ACCOUNTS = [
  // Admin General
  {
    type: 'admin',
    nombre: 'Administrador General',
    email: 'admin@edutechhub.edu.ar',
    password: 'Donpatricio111',
    dni: 'ADM-001'
  },
  // Admin Owner Felipe
  {
    type: 'admin',
    nombre: 'Felipe Lucero',
    email: 'felipelucero534@gmail.com',
    password: 'Donpatricio111',
    dni: 'ADM-OWNER-001'
  },
  // Profesor 1: Matemática (3ro 1ra)
  {
    type: 'profesor',
    nombre: 'Profesor de Matemática',
    email: 'profesor.matematica@tecnica29de6.edu.ar',
    password: '12345678',
    dni: 'PROF-MAT-001',
    materia: 'Matemática'
  },
  // Profesor 2: Programación (4to 2da)
  {
    type: 'profesor',
    nombre: 'Profesor de Programación',
    email: 'profesor.programacion@tecnica29de6.edu.ar',
    password: '12345678',
    dni: 'PROF-PRG-002',
    materia: 'Programación'
  },
  // Profesor 3: Sin clases asignadas
  {
    type: 'profesor',
    nombre: 'Profesor Sin Asignar',
    email: 'profesor.sinclase@tecnica29de6.edu.ar',
    password: '12345678',
    dni: 'PROF-VAC-003',
    materia: 'Educación Tecnológica'
  },
  // Alumno 1: 3ro 1ra
  {
    type: 'alumno',
    nombre: 'Alumno Tres Uno',
    email: 'alumno.3ro1ra@tecnica29de6.edu.ar',
    password: '123456789',
    dni: 'ALU-31-001',
    curso: '3ro 1ra'
  },
  // Alumno 2: 4to 2da
  {
    type: 'alumno',
    nombre: 'Alumno Cuatro Dos',
    email: 'alumno.4to2da@tecnica29de6.edu.ar',
    password: '123456789',
    dni: 'ALU-42-002',
    curso: '4to 2da'
  },
  // Alumno 3: Sin clases asignadas
  {
    type: 'alumno',
    nombre: 'Alumno Sin Clases',
    email: 'alumno.sinclase@tecnica29de6.edu.ar',
    password: '123456789',
    dni: 'ALU-VAC-003',
    curso: '1ro 1ra'
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
      'profesores_clases',
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

    // 4. Crear cuentas de testing
    console.log('\n  👤 Creando cuentas de testing...\n');
    const SALT = 10;
    const createdIds = {};

    for (const acc of TESTING_ACCOUNTS) {
      const hash = await bcrypt.hash(acc.password, SALT);

      const result = await db.run(
        `INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, DNI, curso)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [acc.nombre, acc.email, hash, acc.type, acc.dni, acc.curso || null]
      );
      const userId = result.lastID;
      createdIds[acc.email] = userId;

      // Para alumnos, también insertar en tabla alumno
      if (acc.type === 'alumno') {
        const cursoRes = await db.get(`SELECT id_curso FROM curso WHERE nombre_curso = ?`, [acc.curso || '3ro 1ra']);
        const idCurso = cursoRes ? cursoRes.id_curso : null;
        await db.run(
          `INSERT INTO alumno (DNI, nombre_completo, apellido, id_curso, id_usuario, correo, contrasena)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [acc.dni, acc.nombre, '', idCurso, userId, acc.email, hash]
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

    // 5. Crear clases independientes por división
    const profeMatId = createdIds['profesor.matematica@tecnica29de6.edu.ar'];
    const profePrgId = createdIds['profesor.programacion@tecnica29de6.edu.ar'];
    const alu31Id = createdIds['alumno.3ro1ra@tecnica29de6.edu.ar'];
    const alu42Id = createdIds['alumno.4to2da@tecnica29de6.edu.ar'];

    // Clase 1: Matemática (3ro 1ra)
    const c1 = await db.run(
      `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Matemática 3ro 1ra', '3ro 1ra', 'Matemática', 'Aula 12', 'Profesor de Matemática', profeMatId, profeMatId, 'MAT-31-01']
    );
    await db.run(`INSERT INTO profesores_clases (profesor_id, clase_id) VALUES (?, ?)`, [profeMatId, c1.lastID]);
    await db.run(`INSERT INTO alumnos_clases (alumno_id, materia, codigo) VALUES (?, ?, ?)`, [alu31Id, 'Matemática', 'MAT-31-01']);

    // Clase 2: Programación (4to 2da)
    const c2 = await db.run(
      `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Programación 4to 2da', '4to 2da', 'Programación', 'Lab 2', 'Profesor de Programación', profePrgId, profePrgId, 'PRG-42-02']
    );
    await db.run(`INSERT INTO profesores_clases (profesor_id, clase_id) VALUES (?, ?)`, [profePrgId, c2.lastID]);
    await db.run(`INSERT INTO alumnos_clases (alumno_id, materia, codigo) VALUES (?, ?, ?)`, [alu42Id, 'Programación', 'PRG-42-02']);

    // Clase 3: Redes (5to 1ra) — Creada sin profesor ni alumnos (para probar asignación limpia)
    await db.run(
      `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Redes 5to 1ra', '5to 1ra', 'Redes Informáticas', 'Lab Redes', 'Admin', 1, null, 'RED-51-03']
    );

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
      console.log(`  [${acc.type.toUpperCase().padEnd(8)}] ${acc.email.padEnd(42)} contraseña: ${acc.password}`);
    });
    console.log('');
    console.log('  Ver TESTING_CREDENTIALS.md y docs/MANUAL_TECNICO_FUNCIONAL.md para flujos y detalles.');
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
