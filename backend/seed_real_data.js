#!/usr/bin/env node
/**
 * EduTec-Hub — Script de Limpieza de Tablón y Carga de Datos Realistas
 * ====================================================================
 * 1. Limpia totalmente el tablón (tablon_mensajes y anuncios).
 * 2. Mantiene la estructura de la base de datos e información básica.
 * 3. Registra alumnos realistas asignados a cada clase.
 * 4. Crea trabajos prácticos por clase y sus respectivas entregas calificadas.
 * 5. Alimenta métricas y gráficas de rendimiento docente y estudiantil.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

let sqlite3, sqliteOpen, bcrypt;
try {
  sqlite3 = require('sqlite3').verbose();
  sqliteOpen = require('sqlite').open;
  bcrypt = require('bcrypt');
} catch (e) {
  console.error('❌ Dependencias faltantes. Ejecuta: cd backend && npm install');
  process.exit(1);
}

const DB_PATH = path.resolve(__dirname, '../database/edutechhub.sql');

async function openDb() {
  const db = await sqliteOpen({ filename: DB_PATH, driver: sqlite3.Database });
  await db.run('PRAGMA foreign_keys = ON;');
  await db.run('PRAGMA journal_mode = WAL;');
  return db;
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🌱 EduTec-Hub — Limpieza de Tablón y Sembrado Realista');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const db = await openDb();

  try {
    // ------------------------------------------------------------------------
    // PASO 1: Limpieza del Tablón (Mensajes y Anuncios)
    // ------------------------------------------------------------------------
    console.log('🧹 1. Limpiando mensajes y publicaciones del tablón...');
    await db.run('DELETE FROM tablon_mensajes;');
    await db.run('DELETE FROM anuncios;');
    console.log('   ✅ Tablón y anuncios limpiados completamente (0 publicaciones).');

    // ------------------------------------------------------------------------
    // PASO 2: Asegurar Cursos y Clases
    // ------------------------------------------------------------------------
    console.log('\n📚 2. Verificando clases e infraestructura académica...');
    
    // Sembrar cursos si están vacíos
    const countCursos = await db.get('SELECT COUNT(*) as count FROM curso;');
    if (countCursos.count === 0) {
      const cursosDefecto = ['1ro 1ra', '2do 1ra', '3ro 1ra', '4to 1ra', '5to 1ra', '6to 1ra'];
      for (const c of cursosDefecto) {
        await db.run('INSERT OR IGNORE INTO curso (nombre_curso) VALUES (?);', [c]);
      }
    }

    // Obtener un profesor para asignar como creador de las clases
    let profUser = await db.get("SELECT id_usuario FROM usuarios WHERE rol = 'profesor' LIMIT 1;");
    let profId = profUser ? profUser.id_usuario : null;

    if (!profId) {
      const hashPass = await bcrypt.hash('12345678', 10);
      const resProf = await db.run(
        `INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, DNI)
         VALUES ('Profesor Técnico', 'profesor.tecnica@tecnica29de6.edu.ar', ?, 'profesor', '87654321')`,
        [hashPass]
      );
      profId = resProf.lastID;
      await db.run(
        `INSERT INTO profesor (id_usuario, correo, DNI, nombre_completo, materia, contrasena)
         VALUES (?, 'profesor.tecnica@tecnica29de6.edu.ar', '87654321', 'Profesor Técnico', 'General', ?)`,
        [profId, hashPass]
      );
    }

    const clasesDefecto = [
      { nombre: "Redes de Computadoras", materia: "Redes", aula: "Lab Redes", codigo: "RED-SEC-01" },
      { nombre: "Matemática Aplicada", materia: "Matemática", aula: "Aula 5", codigo: "MAT-SEC-02" },
      { nombre: "Ciencia y Tecnología", materia: "Ciencia y Tecnología", aula: "Aula 3", codigo: "CYT-SEC-03" },
      { nombre: "Programación sobre Redes", materia: "Programación sobre Redes", aula: "Lab 2", codigo: "PSR-SEC-05" },
      { nombre: "Desarrollo de Sistemas", materia: "Desarrollo de Sistemas", aula: "Lab 1", codigo: "DDS-SEC-06" }
    ];

    for (const c of clasesDefecto) {
      const exist = await db.get('SELECT id FROM clases WHERE codigo = ?;', [c.codigo]);
      if (!exist) {
        await db.run(
          `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
           VALUES (?, 'Secundario', ?, ?, 'Profesor Técnico', ?, ?, ?)`,
          [c.nombre, c.materia, c.aula, profId, profId, c.codigo]
        );
      }
    }

    const clases = await db.all('SELECT id, nombre, materia, codigo FROM clases;');
    console.log(`   ✅ Clases disponibles: ${clases.length}`);

    // ------------------------------------------------------------------------
    // PASO 3: Sembrado de Alumnos por Clase
    // ------------------------------------------------------------------------
    console.log('\n👥 3. Cargando alumnos y matriculaciones realistas...');

    const listaAlumnosBase = [
      { nombre: 'Felipe Lucero', email: 'felipe.lucero.617@alu.tecnica29de6.edu.ar', dni: '44123890' },
      { nombre: 'Martín Benítez', email: 'martin.benitez@alu.tecnica29de6.edu.ar', dni: '45892110' },
      { nombre: 'Sofia Fernández', email: 'sofia.fernandez@alu.tecnica29de6.edu.ar', dni: '46102938' },
      { nombre: 'Lucas Gomez', email: 'lucas.gomez@alu.tecnica29de6.edu.ar', dni: '45391024' },
      { nombre: 'Camila Rodriguez', email: 'camila.rodriguez@alu.tecnica29de6.edu.ar', dni: '46294012' },
      { nombre: 'Mateo Rossi', email: 'mateo.rossi@alu.tecnica29de6.edu.ar', dni: '45910293' },
      { nombre: 'Valentina Silva', email: 'valentina.silva@alu.tecnica29de6.edu.ar', dni: '46382019' },
      { nombre: 'Joaquín Martínez', email: 'joaquin.martinez@alu.tecnica29de6.edu.ar', dni: '45291038' }
    ];

    const studentPassHash = await bcrypt.hash('12345678', 10);
    const alumnoUserIds = [];

    for (const st of listaAlumnosBase) {
      let user = await db.get('SELECT id_usuario FROM usuarios WHERE correo = ?;', [st.email]);
      let uId;
      if (!user) {
        const resU = await db.run(
          `INSERT INTO usuarios (nombre_completo, correo, contrasena, DNI, curso, rol)
           VALUES (?, ?, ?, ?, '3ro 1ra', 'alumno');`,
          [st.nombre, st.email, studentPassHash, st.dni]
        );
        uId = resU.lastID;
        await db.run(
          `INSERT INTO alumno (DNI, nombre_completo, apellido, id_curso, id_usuario, correo, contrasena)
           VALUES (?, ?, ?, 1, ?, ?, ?);`,
          [st.dni, st.nombre.split(' ')[0], st.nombre.split(' ')[1] || '', uId, st.email, studentPassHash]
        );
      } else {
        uId = user.id_usuario;
      }
      alumnoUserIds.push({ id: uId, nombre: st.nombre, email: st.email });

      // Matricular alumno en todas las clases
      for (const cl of clases) {
        const enr = await db.get(
          'SELECT id FROM alumnos_clases WHERE alumno_id = ? AND codigo = ?;',
          [uId, cl.codigo]
        );
        if (!enr) {
          await db.run(
            `INSERT INTO alumnos_clases (alumno_id, materia, codigo)
             VALUES (?, ?, ?);`,
            [uId, cl.materia, cl.codigo]
          );
        }
      }
    }

    console.log(`   ✅ ${alumnoUserIds.length} Alumnos matriculados en todas las clases.`);

    // ------------------------------------------------------------------------
    // PASO 4: Trabajos Prácticos y Entregas Calificadas
    // ------------------------------------------------------------------------
    console.log('\n📝 4. Creando trabajos prácticos y entregas corregidas...');

    const plantillasTrabajos = {
      'Redes': [
        { titulo: 'TP 1: Configuración de Enrutamiento estático', desc: 'Configuración de Packet Tracer con subredes y tablas de ruteo.', puntos: 100 },
        { titulo: 'TP 2: Análisis de Protocolos TCP/UDP', desc: 'Captura de paquetes Wireshark y comparación de encabezados.', puntos: 100 },
        { titulo: 'TP 3: Implementación de Servidor DHCP y DNS', desc: 'Servicios de infraestructura en Linux Server.', puntos: 100 },
        { titulo: 'TP 4: Evaluación de Seguridad y Cortafuegos', desc: 'Configuración de reglas iptables y aislamiento de VLANs.', puntos: 100 }
      ],
      'Matemática': [
        { titulo: 'TP 1: Funciones Cuadráticas y Polinómicas', desc: 'Resolución de problemas de optimización y gráficos.', puntos: 100 },
        { titulo: 'TP 2: Matrices y Sistemas de Ecuaciones', desc: 'Método de Gauss-Jordan aplicado a circuitos eléctricos.', puntos: 100 },
        { titulo: 'TP 3: Análisis Estadístico y Medidas de Tendencia', desc: 'Cálculo de desviaciones y varianza en muestras técnicas.', puntos: 100 },
        { titulo: 'TP 4: Geometría Analítica Vectorial', desc: 'Vectores en R2 y R3 con aplicaciones físicas.', puntos: 100 }
      ],
      'Ciencia y Tecnología': [
        { titulo: 'TP 1: Historia y Evolución de los Semiconductores', desc: 'Ensayo técnico sobre materiales de estado sólido.', puntos: 100 },
        { titulo: 'TP 2: Análisis de Impacto Tecnológico', desc: 'Informe sobre sustentabilidad y consumo energético.', puntos: 100 },
        { titulo: 'TP 3: Proyecto de Automatización Escolar', desc: 'Diagrama de bloques y propuesta de sensores.', puntos: 100 },
        { titulo: 'TP 4: Informe de Laboratorio de Sensores', desc: 'Calibración y lectura analógica de magnitudes.', puntos: 100 }
      ],
      'Programación sobre Redes': [
        { titulo: 'TP 1: Sockets TCP en Python', desc: 'Servidor concurrente de chat multihilo.', puntos: 100 },
        { titulo: 'TP 2: Cliente y Servidor HTTP RESTful', desc: 'Desarrollo de API backend con Node.js y Express.', puntos: 100 },
        { titulo: 'TP 3: Consumo de APIs Asíncronas y WebSockets', desc: 'Comunicación en tiempo real cliente-servidor.', puntos: 100 },
        { titulo: 'TP 4: Trabajo Integrador de Microservicios', desc: 'Arquitectura desacoplada conectada por red.', puntos: 100 }
      ],
      'Desarrollo de Sistemas': [
        { titulo: 'TP 1: Modelado de Datos ER y Normalización', desc: 'Diseño de base de datos relacional en 3FN.', puntos: 100 },
        { titulo: 'TP 2: Diseño de Interfaces y Wireframes UI/UX', desc: 'Prototipado en Figma de sistema escolar.', puntos: 100 },
        { titulo: 'TP 3: Implementación CRUD con SQLite/PostgreSQL', desc: 'Controladores backend y consultas SQL seguras.', puntos: 100 },
        { titulo: 'TP 4: Proyecto Final del Sistema de Gestión', desc: 'Entrega final funcional del software.', puntos: 100 }
      ]
    };

    const comentariosFeedback = [
      'Excelente trabajo, respuestas muy completas y prolijas.',
      'Muy buen desarrollo técnico. Prestar atención a la sintaxis en la conclusión.',
      'Entrega correcta y entregada a tiempo. Buen dominio de los conceptos.',
      'Buen trabajo general, con algunas observaciones en los gráficos adjuntos.',
      'Trabajo aprobado de forma satisfactoria.',
      'Demuestra gran dedicación y comprensión clara del tema.'
    ];

    let totalTrabajos = 0;
    let totalEntregas = 0;

    for (const cl of clases) {
      const plantillas = plantillasTrabajos[cl.materia] || plantillasTrabajos['Redes'];

      for (let i = 0; i < plantillas.length; i++) {
        const tp = plantillas[i];
        let trabajo = await db.get('SELECT id FROM trabajos WHERE clase_id = ? AND titulo = ?;', [cl.id, tp.titulo]);
        let trabajoId;

        if (!trabajo) {
          const fechaLim = new Date(Date.now() - (4 - i) * 7 * 24 * 60 * 60 * 1000).toISOString();
          const resT = await db.run(
            `INSERT INTO trabajos (clase_id, titulo, descripcion, instrucciones, fecha_limite, puntos_max, estado, creado_por)
             VALUES (?, ?, ?, 'Realizar el trabajo siguiendo las consignas y adjuntar el informe.', ?, ?, 'publicado', ?);`,
            [cl.id, tp.titulo, tp.desc, fechaLim, tp.puntos, profId]
          );
          trabajoId = resT.lastID;
        } else {
          trabajoId = trabajo.id;
        }
        totalTrabajos++;

        // Generar entregas para los alumnos en este trabajo
        for (let idx = 0; idx < alumnoUserIds.length; idx++) {
          const st = alumnoUserIds[idx];
          const existEnt = await db.get('SELECT id FROM entregas WHERE trabajo_id = ? AND alumno_id = ?;', [trabajoId, st.id]);

          if (!existEnt) {
            // Notas distribuidas entre 6 y 10 para crear variabilidad realista
            const calificacion = 60 + Math.floor(Math.random() * 41); // 60 a 100 (nota sobre 100 o escala 10)
            const notaNormalizada = Math.min(10, Math.max(6, Math.round(calificacion / 10))); // 6 a 10

            const diasAtrasEntrega = 14 - i * 3;
            const fechaEntrega = new Date(Date.now() - diasAtrasEntrega * 24 * 60 * 60 * 1000).toISOString();
            const fechaCalificacion = new Date(Date.now() - (diasAtrasEntrega - 2) * 24 * 60 * 60 * 1000).toISOString();

            const feedbackText = comentariosFeedback[(idx + i) % comentariosFeedback.length];

            await db.run(
              `INSERT INTO entregas (trabajo_id, alumno_id, archivo_nombre, archivo_path, comentario, estado, calificacion, feedback, fecha_entrega, fecha_calificacion)
               VALUES (?, ?, ?, '/uploads/informe_alumno.pdf', 'Adjunto la entrega correspondiente al TP.', 'corregido', ?, ?, ?, ?);`,
              [trabajoId, st.id, `informe_${st.nombre.toLowerCase().replace(/\s+/g, '_')}_tp${i+1}.pdf`, notaNormalizada, feedbackText, fechaEntrega, fechaCalificacion]
            );
            totalEntregas++;
          }
        }
      }
    }

    console.log(`   ✅ ${totalTrabajos} Trabajos prácticos verificados.`);
    console.log(`   ✅ ${totalEntregas} Entregas de alumnos calificadas y registradas.`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🎉 Limpieza y Carga Realista Completadas con Éxito!');
    console.log('  • Tablón limpio (0 mensajes, listo para publicar).');
    console.log('  • Alumnos y matriculaciones cargadas.');
    console.log('  • Trabajos y calificaciones listas para las gráficas.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    console.error('❌ Error durante el sembrado de datos:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
