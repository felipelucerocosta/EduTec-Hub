const express = require('express');
const { Readable } = require('stream');
const http = require('http');

// Path setup
const pool = require('../dist_backend/conexion_pg.js').default;
const adminApiRouter = require('../dist_backend/admin_api.js').default;
const loginRouter = require('../dist_backend/login.js').default;

const app = express();
app.use(express.json());

// In-memory session store simulation
const sessions = new Map();
let sessionCounter = 1;

app.use((req, res, next) => {
  const cookieHeader = req.headers['cookie'] || '';
  const match = cookieHeader.match(/sid=([^;]+)/);
  let sid = match ? match[1] : null;

  if (!sid || !sessions.has(sid)) {
    sid = 'sid-' + (sessionCounter++);
    sessions.set(sid, {});
  }

  req.session = sessions.get(sid);
  res.setHeader('Set-Cookie', `sid=${sid}; Path=/; HttpOnly`);
  next();
});

app.use('/api', loginRouter);
app.use('/api', adminApiRouter);

// Dispatcher function that calls app.handle in-process
function request(method, url, body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const reqStream = payload ? Readable.from([Buffer.from(payload)]) : Readable.from([]);

    reqStream.headers = {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload),
    };
    if (cookie) reqStream.headers['cookie'] = cookie;
    reqStream.method = method;
    reqStream.url = url;

    const res = new http.ServerResponse(reqStream);
    let responseBody = '';

    res.write = (chunk) => {
      responseBody += chunk;
      return true;
    };

    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      const setCookie = res.getHeader('set-cookie');
      let data;
      try {
        data = JSON.parse(responseBody);
      } catch {
        data = { raw: responseBody };
      }
      resolve({
        status: res.statusCode,
        cookie: Array.isArray(setCookie) ? setCookie[0] : (setCookie || ''),
        data
      });
    };

    app.handle(reqStream, res, (err) => {
      if (err) reject(err);
      else resolve({ status: 404, data: { error: 'Not found' } });
    });
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('   PRUEBA INTEGRAL E2E - SISTEMA DE CREACIÓN DE CUENTAS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Limpieza de usuarios de prueba anteriores para garantizar idempotencia
  const testEmails = [
    'lucas.benitez@edutechhub.edu.ar',
    'martina.gomez@edutechhub.edu.ar',
    'joaquin.rodriguez@edutechhub.edu.ar',
    'camila.fernandez@edutechhub.edu.ar',
    'roberto.mendez@edutechhub.edu.ar'
  ];
  for (const email of testEmails) {
    const u = await pool.query('SELECT id_usuario FROM usuarios WHERE LOWER(correo) = $1', [email]);
    if (u.rows.length > 0) {
      const id = u.rows[0].id_usuario;
      await pool.query('DELETE FROM alumno WHERE id_usuario = $1', [id]);
      await pool.query('DELETE FROM profesor WHERE id_usuario = $1', [id]);
      await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
    }
  }

  // 2. Iniciar sesión como Admin
  console.log('--- Fase 1: Autenticación Administrativa ---');
  const loginAdminRes = await request('POST', '/api/login', {
    correo: 'admin@edutechhub.edu.ar',
    contrasena: 'Donpatricio111'
  });
  assert(loginAdminRes.status === 200 && loginAdminRes.data.usuario?.rol === 'admin',
    'Autenticación de administrador inicial exitosa',
    JSON.stringify(loginAdminRes.data));
  const adminCookie = loginAdminRes.cookie;

  // 3. Validaciones de Rechazo / Integridad
  console.log('\n--- Fase 2: Validaciones de Restricciones e Integridad Académica ---');
  
  // 3a. Alumno sin curso
  const resNoCurso = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Test Sin Curso',
    correo: 'sin.curso@edutechhub.edu.ar',
    contrasena: 'Pass123456!',
    rol: 'alumno',
    DNI: '88888001',
    nivel_educativo: 'Secundario',
    curso: ''
  }, adminCookie);
  assert(resNoCurso.status === 400, 'Rechazo 400 al crear alumno sin curso asignado', JSON.stringify(resNoCurso.data));

  // 3b. Alumno sin nivel educativo
  const resNoNivel = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Test Sin Nivel',
    correo: 'sin.nivel@edutechhub.edu.ar',
    contrasena: 'Pass123456!',
    rol: 'alumno',
    DNI: '88888002',
    curso: '1ro 1ra'
  }, adminCookie);
  assert(resNoNivel.status === 400, 'Rechazo 400 al crear alumno sin nivel educativo', JSON.stringify(resNoNivel.data));

  // 3c. Alumno con curso y nivel incompatibles (Inicial con '6to 10ma')
  const resCruzado = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Test Nivel Incompatible',
    correo: 'cruzado@edutechhub.edu.ar',
    contrasena: 'Pass123456!',
    rol: 'alumno',
    DNI: '88888003',
    nivel_educativo: 'Inicial',
    curso: '6to 10ma'
  }, adminCookie);
  assert(resCruzado.status === 400, 'Rechazo 400 al mezclar nivel Inicial con curso Secundario (6to 10ma)', JSON.stringify(resCruzado.data));

  // 3d. Profesor sin nivel educativo
  const resProfNoNivel = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Profesor Sin Nivel',
    correo: 'prof.sin.nivel@edutechhub.edu.ar',
    contrasena: 'Pass123456!',
    rol: 'profesor',
    DNI: '88888004'
  }, adminCookie);
  assert(resProfNoNivel.status === 400, 'Rechazo 400 al crear profesor sin nivel educativo', JSON.stringify(resProfNoNivel.data));

  // 4. Creación Exitosa por Nivel Educativo
  console.log('\n--- Fase 3: Creación de Alumnos por Nivel y Profesor ---');

  // 4a. Alumno Nivel Inicial
  const resInicial = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Lucas Benítez',
    correo: 'lucas.benitez@edutechhub.edu.ar',
    contrasena: 'ClaveInicial123!',
    rol: 'alumno',
    DNI: '90000001',
    nivel_educativo: 'Inicial',
    curso: 'Sala de 5',
    estado_acceso: 'ACTIVO'
  }, adminCookie);
  assert(resInicial.status === 201 && resInicial.data.success, 'Creación de Alumno Nivel Inicial (Sala de 5)', JSON.stringify(resInicial.data));

  // 4b. Alumno Nivel Primario
  const resPrimario = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Martina Gómez',
    correo: 'martina.gomez@edutechhub.edu.ar',
    contrasena: 'ClavePrimaria123!',
    rol: 'alumno',
    DNI: '90000002',
    nivel_educativo: 'Primario',
    curso: '4to Primaria',
    estado_acceso: 'ACTIVO'
  }, adminCookie);
  assert(resPrimario.status === 201 && resPrimario.data.success, 'Creación de Alumno Nivel Primario (4to Primaria)', JSON.stringify(resPrimario.data));

  // 4c. Alumno Nivel Secundario
  const resSecundario = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Joaquín Rodríguez',
    correo: 'joaquin.rodriguez@edutechhub.edu.ar',
    contrasena: 'ClaveSecundaria123!',
    rol: 'alumno',
    DNI: '90000003',
    nivel_educativo: 'Secundario',
    curso: '3ro 1ra',
    estado_acceso: 'ACTIVO'
  }, adminCookie);
  assert(resSecundario.status === 201 && resSecundario.data.success, 'Creación de Alumno Nivel Secundario (3ro 1ra)', JSON.stringify(resSecundario.data));

  // 4d. Alumno Nivel Terciario
  const resTerciario = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Camila Fernández',
    correo: 'camila.fernandez@edutechhub.edu.ar',
    contrasena: 'ClaveTerciaria123!',
    rol: 'alumno',
    DNI: '90000004',
    nivel_educativo: 'Terciario',
    curso: '1er Año Tecnicatura',
    estado_acceso: 'ACTIVO'
  }, adminCookie);
  assert(resTerciario.status === 201 && resTerciario.data.success, 'Creación de Alumno Nivel Terciario (1er Año Tecnicatura)', JSON.stringify(resTerciario.data));

  // 4e. Profesor
  const resProf = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Prof. Roberto Méndez',
    correo: 'roberto.mendez@edutechhub.edu.ar',
    contrasena: 'ClaveProfesor123!',
    rol: 'profesor',
    DNI: '90000005',
    nivel_educativo: 'Secundario',
    materia: 'Sistemas Embebidos e IoT',
    estado_acceso: 'ACTIVO'
  }, adminCookie);
  assert(resProf.status === 201 && resProf.data.success, 'Creación de Profesor con Nivel y Materia', JSON.stringify(resProf.data));

  // 5. Verificación de Duplicados
  console.log('\n--- Fase 4: Control de Duplicados ---');
  const resDupEmail = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Otro Lucas',
    correo: 'lucas.benitez@edutechhub.edu.ar', // Duplicado
    contrasena: 'ClaveNueva123!',
    rol: 'alumno',
    DNI: '99999999',
    nivel_educativo: 'Inicial',
    curso: 'Sala de 5'
  }, adminCookie);
  assert(resDupEmail.status === 409, 'Rechazo 409 por correo electrónico duplicado', JSON.stringify(resDupEmail.data));

  const resDupDNI = await request('POST', '/api/admin/usuarios', {
    nombre_completo: 'Otra Martina',
    correo: 'otra.martina@edutechhub.edu.ar',
    contrasena: 'ClaveNueva123!',
    rol: 'alumno',
    DNI: '90000002', // Duplicado de Martina Gómez
    nivel_educativo: 'Primario',
    curso: '4to Primaria'
  }, adminCookie);
  assert(resDupDNI.status === 409, 'Rechazo 409 por DNI duplicado', JSON.stringify(resDupDNI.data));

  // 6. Verificación en Base de Datos (Integridad y Claves Foráneas)
  console.log('\n--- Fase 5: Verificación en Base de Datos ---');
  
  // Alumno Inicial
  const dbAluIni = await pool.query(`
    SELECT u.id_usuario, u.correo, u.rol, u.curso, u.nivel_educativo, u.estado_acceso,
           a.id_alumno, a.nombre_completo, a.apellido, a.id_curso, c.nombre_curso, c.nivel_educativo as curso_nivel
    FROM usuarios u
    JOIN alumno a ON a.id_usuario = u.id_usuario
    LEFT JOIN curso c ON c.id_curso = a.id_curso
    WHERE u.correo = 'lucas.benitez@edutechhub.edu.ar'
  `);
  assert(
    dbAluIni.rows.length === 1 &&
    dbAluIni.rows[0].nivel_educativo === 'Inicial' &&
    dbAluIni.rows[0].nombre_curso === 'Sala de 5' &&
    dbAluIni.rows[0].curso_nivel === 'Inicial' &&
    dbAluIni.rows[0].id_curso !== null,
    'BD: Alumno Inicial guardado en usuarios y alumno con relación de id_curso válida',
    JSON.stringify(dbAluIni.rows[0])
  );

  // Alumno Primario
  const dbAluPri = await pool.query(`
    SELECT u.id_usuario, u.correo, u.rol, u.curso, u.nivel_educativo,
           a.id_alumno, a.id_curso, c.nombre_curso, c.nivel_educativo as curso_nivel
    FROM usuarios u
    JOIN alumno a ON a.id_usuario = u.id_usuario
    LEFT JOIN curso c ON c.id_curso = a.id_curso
    WHERE u.correo = 'martina.gomez@edutechhub.edu.ar'
  `);
  assert(
    dbAluPri.rows.length === 1 &&
    dbAluPri.rows[0].nivel_educativo === 'Primario' &&
    dbAluPri.rows[0].nombre_curso === '4to Primaria' &&
    dbAluPri.rows[0].id_curso !== null,
    'BD: Alumno Primario guardado con id_curso correspondiente a Primaria',
    JSON.stringify(dbAluPri.rows[0])
  );

  // Alumno Secundario
  const dbAluSec = await pool.query(`
    SELECT u.id_usuario, u.correo, u.rol, u.curso, u.nivel_educativo,
           a.id_alumno, a.id_curso, c.nombre_curso, c.nivel_educativo as curso_nivel
    FROM usuarios u
    JOIN alumno a ON a.id_usuario = u.id_usuario
    LEFT JOIN curso c ON c.id_curso = a.id_curso
    WHERE u.correo = 'joaquin.rodriguez@edutechhub.edu.ar'
  `);
  assert(
    dbAluSec.rows.length === 1 &&
    dbAluSec.rows[0].nivel_educativo === 'Secundario' &&
    dbAluSec.rows[0].nombre_curso === '3ro 1ra' &&
    dbAluSec.rows[0].id_curso !== null,
    'BD: Alumno Secundario guardado con id_curso correspondiente a 3ro 1ra',
    JSON.stringify(dbAluSec.rows[0])
  );

  // Alumno Terciario
  const dbAluTer = await pool.query(`
    SELECT u.id_usuario, u.correo, u.rol, u.curso, u.nivel_educativo,
           a.id_alumno, a.id_curso, c.nombre_curso, c.nivel_educativo as curso_nivel
    FROM usuarios u
    JOIN alumno a ON a.id_usuario = u.id_usuario
    LEFT JOIN curso c ON c.id_curso = a.id_curso
    WHERE u.correo = 'camila.fernandez@edutechhub.edu.ar'
  `);
  assert(
    dbAluTer.rows.length === 1 &&
    dbAluTer.rows[0].nivel_educativo === 'Terciario' &&
    dbAluTer.rows[0].nombre_curso === '1er Año Tecnicatura' &&
    dbAluTer.rows[0].id_curso !== null,
    'BD: Alumno Terciario guardado con id_curso correspondiente a Terciario',
    JSON.stringify(dbAluTer.rows[0])
  );

  // Profesor
  const dbProf = await pool.query(`
    SELECT u.id_usuario, u.correo, u.rol, u.nivel_educativo,
           p.id_profesor, p.materia, p.nivel_educativo as prof_nivel
    FROM usuarios u
    JOIN profesor p ON p.id_usuario = u.id_usuario
    WHERE u.correo = 'roberto.mendez@edutechhub.edu.ar'
  `);
  assert(
    dbProf.rows.length === 1 &&
    dbProf.rows[0].materia === 'Sistemas Embebidos e IoT' &&
    dbProf.rows[0].nivel_educativo === 'Secundario',
    'BD: Profesor guardado en usuarios y profesor con materia y nivel educativo',
    JSON.stringify(dbProf.rows[0])
  );

  // Admins preservados
  const dbAdmins = await pool.query(`SELECT correo, rol FROM usuarios WHERE rol = 'admin'`);
  assert(dbAdmins.rows.length >= 4, `BD: Cuentas administradoras preservadas intactas (${dbAdmins.rows.length} administradores)`, '');

  // 7. Verificación de Listados Administrativos
  console.log('\n--- Fase 6: Verificación de Endpoints de Listados ---');

  // /api/admin/usuarios
  const listUsuariosRes = await request('GET', '/api/admin/usuarios', null, adminCookie);
  const foundAluIniInList = listUsuariosRes.data.some(u => u.correo === 'lucas.benitez@edutechhub.edu.ar' && u.nivel_educativo === 'Inicial');
  const foundProfInList = listUsuariosRes.data.some(u => u.correo === 'roberto.mendez@edutechhub.edu.ar' && u.nivel_educativo === 'Secundario');
  assert(listUsuariosRes.status === 200 && foundAluIniInList && foundProfInList,
    'Listado /api/admin/usuarios incluye los nuevos usuarios con sus roles y niveles',
    `Total usuarios: ${listUsuariosRes.data?.length}`);

  // /api/admin/alumnos
  const listAlumnosRes = await request('GET', '/api/admin/alumnos', null, adminCookie);
  const foundAluPri = listAlumnosRes.data.some(a => a.correo === 'martina.gomez@edutechhub.edu.ar' && a.curso === '4to Primaria');
  assert(listAlumnosRes.status === 200 && foundAluPri,
    'Listado /api/admin/alumnos incluye a los alumnos creados con su curso asignado',
    `Total alumnos: ${listAlumnosRes.data?.length}`);

  // /api/admin/profesores
  const listProfRes = await request('GET', '/api/admin/profesores', null, adminCookie);
  const foundProf = listProfRes.data.some(p => p.correo === 'roberto.mendez@edutechhub.edu.ar' && p.materia === 'Sistemas Embebidos e IoT');
  assert(listProfRes.status === 200 && foundProf,
    'Listado /api/admin/profesores incluye al profesor creado con su materia y nivel',
    `Total profesores: ${listProfRes.data?.length}`);

  // /api/admin/cursos
  const listCursosRes = await request('GET', '/api/admin/cursos?nivel=Inicial', null, adminCookie);
  assert(listCursosRes.status === 200 && listCursosRes.data.length >= 3,
    'Endpoint /api/admin/cursos filtra correctamente por nivel educativo (Inicial)',
    `Cursos encontrados: ${listCursosRes.data?.length}`);

  // 8. Verificación de Inicio de Sesión (Login)
  console.log('\n--- Fase 7: Verificación de Inicio de Sesión (Login E2E) ---');

  // Login Alumno Inicial
  const logAluIni = await request('POST', '/api/login', {
    correo: 'lucas.benitez@edutechhub.edu.ar',
    contrasena: 'ClaveInicial123!'
  });
  assert(logAluIni.status === 200 && logAluIni.data.usuario?.rol === 'alumno' && logAluIni.data.usuario?.estado_acceso === 'ACTIVO',
    'Login exitoso Alumno Nivel Inicial (acceso a /dashboard)',
    JSON.stringify(logAluIni.data.usuario));

  // Login Alumno Primario
  const logAluPri = await request('POST', '/api/login', {
    correo: 'martina.gomez@edutechhub.edu.ar',
    contrasena: 'ClavePrimaria123!'
  });
  assert(logAluPri.status === 200 && logAluPri.data.usuario?.rol === 'alumno' && logAluPri.data.usuario?.estado_acceso === 'ACTIVO',
    'Login exitoso Alumno Nivel Primario (acceso a /dashboard)',
    JSON.stringify(logAluPri.data.usuario));

  // Login Alumno Secundario
  const logAluSec = await request('POST', '/api/login', {
    correo: 'joaquin.rodriguez@edutechhub.edu.ar',
    contrasena: 'ClaveSecundaria123!'
  });
  assert(logAluSec.status === 200 && logAluSec.data.usuario?.rol === 'alumno' && logAluSec.data.usuario?.estado_acceso === 'ACTIVO',
    'Login exitoso Alumno Nivel Secundario (acceso a /dashboard)',
    JSON.stringify(logAluSec.data.usuario));

  // Login Alumno Terciario
  const logAluTer = await request('POST', '/api/login', {
    correo: 'camila.fernandez@edutechhub.edu.ar',
    contrasena: 'ClaveTerciaria123!'
  });
  assert(logAluTer.status === 200 && logAluTer.data.usuario?.rol === 'alumno' && logAluTer.data.usuario?.estado_acceso === 'ACTIVO',
    'Login exitoso Alumno Nivel Terciario (acceso a /dashboard)',
    JSON.stringify(logAluTer.data.usuario));

  // Login Profesor
  const logProf = await request('POST', '/api/login', {
    correo: 'roberto.mendez@edutechhub.edu.ar',
    contrasena: 'ClaveProfesor123!'
  });
  assert(logProf.status === 200 && logProf.data.usuario?.rol === 'profesor' && logProf.data.usuario?.estado_acceso === 'ACTIVO',
    'Login exitoso Profesor (acceso a /clases)',
    JSON.stringify(logProf.data.usuario));

  // Login con contraseña incorrecta
  const logBad = await request('POST', '/api/login', {
    correo: 'roberto.mendez@edutechhub.edu.ar',
    contrasena: 'ClaveTotalmenteErronea999'
  });
  assert(logBad.status === 401, 'Rechazo 401 al intentar login con credenciales erróneas', JSON.stringify(logBad.data));

  console.log('\n================================================================');
  console.log(`RESUMEN DE PRUEBAS: ${passed} PASADAS, ${failed} FALLIDAS`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS SATISFACTORIAMENTE AL 100%.');
  } else {
    console.error('⚠️ ALGUNAS PRUEBAS FALLARON.');
  }

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Error fatal durante la ejecución de las pruebas:', err);
  process.exit(1);
});
