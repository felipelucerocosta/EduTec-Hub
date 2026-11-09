import pool from './conexion_pg';
import * as bcrypt from 'bcrypt';

// Helper para verificar y agregar columnas sin generar excepciones SQL ruidosas
async function addColumnIfNotExists(table: string, column: string, columnDef: string) {
    try {
        const info = await pool.query(`PRAGMA table_info(${table});`);
        const exists = info.rows && info.rows.some((r: any) => r.name === column);
        if (!exists) {
            await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDef};`);
        }
    } catch (_e) {
        // En caso de concurrencia o tabla no creada aún
    }
}

interface SeedUserData {
    correo: string;
    nombre: string;
    pass: string;
    dni: string;
    rol: 'admin' | 'profesor' | 'alumno';
    estado_acceso?: string;
    curso?: string | null;
}

/**
 * Realiza un upsert completamente idempotente en la tabla 'usuarios'
 * verificando primero por DNI y por correo para no violar UNIQUE constraints.
 */
async function upsertUsuario(u: SeedUserData, saltRounds: number = 10): Promise<number> {
    const hashPass = await bcrypt.hash(u.pass, saltRounds);
    const emailNorm = u.correo.trim().toLowerCase();
    const dniNorm = u.dni.trim();
    const estadoAcceso = u.estado_acceso || 'ACTIVO';
    const cursoVal = u.curso || null;

    // 1. Comprobación previa obligatoria por DNI y por Correo
    const existByDni = await pool.query(
        'SELECT id_usuario, correo, DNI, rol FROM usuarios WHERE DNI = $1',
        [dniNorm]
    );
    const existByEmail = await pool.query(
        'SELECT id_usuario, correo, DNI, rol FROM usuarios WHERE LOWER(correo) = $1',
        [emailNorm]
    );

    let idUsuario: number;

    if (existByDni.rows.length > 0 && existByEmail.rows.length > 0) {
        const idDni = existByDni.rows[0].id_usuario;
        const idEmail = existByEmail.rows[0].id_usuario;

        if (idDni === idEmail) {
            // El mismo registro coincide en DNI y Correo: actualizar
            idUsuario = idDni;
            await pool.query(
                `UPDATE usuarios 
                 SET contrasena = $1, nombre_completo = $2, rol = $3, estado_acceso = $4, curso = $5, correo = $6, DNI = $7 
                 WHERE id_usuario = $8`,
                [hashPass, u.nombre, u.rol, estadoAcceso, cursoVal, emailNorm, dniNorm, idUsuario]
            );
        } else {
            // Dos registros distintos en conflicto temporal: liberar DNI previo
            idUsuario = idEmail;
            await pool.query(
                `UPDATE usuarios SET DNI = 'TEMP-' || id_usuario || '-' || hex(randomblob(4)) WHERE id_usuario = $1`,
                [idDni]
            );
            await pool.query(
                `UPDATE usuarios 
                 SET contrasena = $1, nombre_completo = $2, rol = $3, estado_acceso = $4, curso = $5, correo = $6, DNI = $7 
                 WHERE id_usuario = $8`,
                [hashPass, u.nombre, u.rol, estadoAcceso, cursoVal, emailNorm, dniNorm, idUsuario]
            );
        }
    } else if (existByDni.rows.length > 0) {
        // Encontrado por DNI -> actualizar correo y datos
        idUsuario = existByDni.rows[0].id_usuario;
        await pool.query(
            `UPDATE usuarios 
             SET contrasena = $1, nombre_completo = $2, correo = $3, rol = $4, estado_acceso = $5, curso = $6 
             WHERE id_usuario = $7`,
            [hashPass, u.nombre, emailNorm, u.rol, estadoAcceso, cursoVal, idUsuario]
        );
    } else if (existByEmail.rows.length > 0) {
        // Encontrado por Correo -> actualizar DNI y datos
        idUsuario = existByEmail.rows[0].id_usuario;
        await pool.query(
            `UPDATE usuarios 
             SET contrasena = $1, nombre_completo = $2, DNI = $3, rol = $4, estado_acceso = $5, curso = $6 
             WHERE id_usuario = $7`,
            [hashPass, u.nombre, dniNorm, u.rol, estadoAcceso, cursoVal, idUsuario]
        );
    } else {
        // No existe: Insertar nuevo usuario
        const insertRes = await pool.query(
            `INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, curso, rol, estado_acceso)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_usuario`,
            [hashPass, u.nombre, emailNorm, dniNorm, cursoVal, u.rol, estadoAcceso]
        );
        idUsuario = insertRes.rows[0]?.id_usuario || insertRes.insertId;
    }

    return idUsuario;
}

const crearTablas = async () => {
    console.log("🔄 Inicializando Base de Datos Embebida (SQLite)...");

    try {
        // 1. Tabla CURSO
        await pool.query(`
            CREATE TABLE IF NOT EXISTS curso (
                id_curso INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_curso TEXT UNIQUE NOT NULL
            );
        `);

        // 2. Tabla USUARIOS (SQLite compatible)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
                contrasena TEXT NOT NULL,
                nombre_completo TEXT NOT NULL,
                correo TEXT UNIQUE NOT NULL,
                DNI TEXT UNIQUE NOT NULL,
                curso TEXT,
                rol TEXT DEFAULT 'alumno',
                estado_acceso TEXT DEFAULT 'PENDIENTE_DE_ASIGNACION',
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Migración: agregar estado_acceso si la tabla ya existía
        await addColumnIfNotExists('usuarios', 'estado_acceso', "TEXT DEFAULT 'PENDIENTE_DE_ASIGNACION'");
        
        // Activar admins y profesores existentes
        try {
            await pool.query(`UPDATE usuarios SET estado_acceso = 'ACTIVO' WHERE rol IN ('admin', 'profesor') AND (estado_acceso IS NULL OR estado_acceso != 'SUSPENDIDO');`);
        } catch (_e) {}

        // 2b. Tabla AUDITORIA_ACCESO
        await pool.query(`
            CREATE TABLE IF NOT EXISTS auditoria_acceso (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                correo TEXT,
                evento TEXT NOT NULL,
                detalle TEXT,
                ip TEXT,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Tabla ALUMNO
        await pool.query(`
            CREATE TABLE IF NOT EXISTS alumno (
                id_alumno INTEGER PRIMARY KEY AUTOINCREMENT,
                DNI TEXT UNIQUE NOT NULL,
                nombre_completo TEXT NOT NULL,
                apellido TEXT,
                id_curso INTEGER,
                id_usuario INTEGER,
                correo TEXT NOT NULL,
                contrasena TEXT NOT NULL,
                FOREIGN KEY(id_curso) REFERENCES curso(id_curso),
                FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
            );
        `);

        // 4. Tabla PROFESOR
        await pool.query(`
            CREATE TABLE IF NOT EXISTS profesor (
                id_profesor INTEGER PRIMARY KEY AUTOINCREMENT,
                id_usuario INTEGER,
                correo TEXT NOT NULL,
                DNI TEXT UNIQUE NOT NULL,
                nombre_completo TEXT NOT NULL,
                materia TEXT,
                contrasena TEXT NOT NULL,
                FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
            );
        `);

        // 5. Tabla CLASES
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                seccion TEXT,
                materia TEXT NOT NULL,
                aula TEXT,
                creador TEXT NOT NULL,
                creador_id INTEGER,
                titular_id INTEGER,
                codigo TEXT UNIQUE NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. Tabla ALUMNOS_CLASES (Inscripciones)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS alumnos_clases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alumno_id INTEGER NOT NULL,
                materia TEXT NOT NULL,
                codigo TEXT NOT NULL,
                fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(alumno_id) REFERENCES usuarios(id_usuario)
            );
        `);

        // 6b. Tabla PROFESORES_CLASES (Asignaciones explícitas de docentes)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS profesores_clases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profesor_id INTEGER NOT NULL,
                clase_id INTEGER NOT NULL,
                fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(profesor_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
                UNIQUE(profesor_id, clase_id)
            );
        `);

        // 7. Tabla ACTAS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS actas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                originalname TEXT NOT NULL,
                path TEXT NOT NULL,
                mimetype TEXT,
                size INTEGER,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 7.5. Tabla TABLON_MENSAJES (Foro de Consultas)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tablon_mensajes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                usuario_nombre TEXT,
                mensaje TEXT NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await addColumnIfNotExists('tablon_mensajes', 'usuario_id', 'INTEGER');
        await addColumnIfNotExists('tablon_mensajes', 'usuario_nombre', 'TEXT');

        // 8. Tabla PASSWORD_RESETS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT NOT NULL UNIQUE,
                id_usuario INTEGER NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            );
        `);
        
        // 9. Tabla CALENDARIO_NOTAS
        await pool.query(`
             CREATE TABLE IF NOT EXISTS calendario_notas (
                id_nota INTEGER PRIMARY KEY AUTOINCREMENT,
                id_usuario INTEGER,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                fecha_evento TIMESTAMP NOT NULL,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            );
        `);

        // 10. Tabla EMAIL_VERIFICATIONS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS email_verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                code TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT false,
                FOREIGN KEY(user_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            );
        `);

        // 11. Tabla TRABAJOS (Assignments)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trabajos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clase_id INTEGER NOT NULL,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                instrucciones TEXT,
                fecha_limite TIMESTAMP,
                puntos_max INTEGER DEFAULT 10,
                estado TEXT DEFAULT 'publicado',
                tipo_entrega TEXT DEFAULT 'individual',
                creado_por INTEGER,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
                FOREIGN KEY(creado_por) REFERENCES usuarios(id_usuario)
            );
        `);
        // Migración segura: agregar tipo_entrega si la tabla ya existía
        await addColumnIfNotExists('trabajos', 'tipo_entrega', "TEXT DEFAULT 'individual'");
        try {
            await pool.query(`UPDATE trabajos SET puntos_max = 10 WHERE puntos_max != 10;`);
        } catch (_e) {}

        // 12. Tabla ENTREGAS (Submissions)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS entregas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trabajo_id INTEGER NOT NULL,
                alumno_id INTEGER NOT NULL,
                archivo_nombre TEXT,
                archivo_path TEXT,
                comentario TEXT,
                estado TEXT DEFAULT 'entregado',
                calificacion INTEGER,
                feedback TEXT,
                fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_calificacion TIMESTAMP,
                FOREIGN KEY(trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE,
                FOREIGN KEY(alumno_id) REFERENCES usuarios(id_usuario)
            );
        `);

        // 12b. Tabla ENTREGA_INTEGRANTES (Group submission members)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS entrega_integrantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entrega_id INTEGER NOT NULL,
                usuario_id INTEGER NOT NULL,
                calificacion_individual INTEGER,
                FOREIGN KEY(entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id_usuario),
                UNIQUE(entrega_id, usuario_id)
            );
        `);

        // 13. Tabla MATERIALES (Class Materials)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS materiales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clase_id INTEGER NOT NULL,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                tipo TEXT DEFAULT 'documento',
                archivo_nombre TEXT,
                archivo_path TEXT,
                enlace TEXT,
                creado_por INTEGER,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
                FOREIGN KEY(creado_por) REFERENCES usuarios(id_usuario)
            );
        `);

        // 14. Tabla NOTIFICACIONES
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notificaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                tipo TEXT NOT NULL,
                titulo TEXT NOT NULL,
                mensaje TEXT,
                leida INTEGER DEFAULT 0,
                referencia_tipo TEXT,
                referencia_id INTEGER,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            );
        `);

        // 15. Tabla ANUNCIOS (Class Announcements / Board)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS anuncios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clase_id INTEGER NOT NULL,
                autor_id INTEGER NOT NULL,
                contenido TEXT NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
                FOREIGN KEY(autor_id) REFERENCES usuarios(id_usuario)
            );
        `);

        // 16. Tabla PERIODOS_ACADEMICOS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS periodos_academicos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                tipo TEXT DEFAULT 'bimestre',
                fecha_inicio TEXT NOT NULL,
                fecha_fin TEXT NOT NULL,
                anio INTEGER NOT NULL,
                activo INTEGER DEFAULT 1
            );
        `);

        // 17. Tabla SIMULADORES
        await pool.query(`
            CREATE TABLE IF NOT EXISTS simuladores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                materia_keyword TEXT NOT NULL,
                nombre TEXT NOT NULL,
                descripcion TEXT,
                tipo TEXT NOT NULL,
                clase_id INTEGER,
                activo INTEGER DEFAULT 1,
                FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE SET NULL
            );
        `);

        // 18. Tabla SESIONES_SIMULADOR
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sesiones_simulador (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                simulador_id INTEGER NOT NULL,
                usuario_id INTEGER NOT NULL,
                datos_sesion TEXT,
                completado INTEGER DEFAULT 0,
                duracion_segundos INTEGER,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(simulador_id) REFERENCES simuladores(id),
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id_usuario)
            );
        `);

        console.log("✅ Estructura de tablas en SQLite verificada/creada correctamente.");

        // 11. Sembrado de Cursos (Idempotente)
        await pool.query(`
            INSERT INTO curso (nombre_curso) VALUES
            ('1ro 1ra'), ('1ro 2da'), ('1ro 3ra'), ('1ro 4ta'), ('1ro 5ta'), ('1ro 6ta'), ('1ro 7ma'), ('1ro 8va'), ('1ro 9na'), ('1ro 10ma'),
            ('2do 1ra'), ('2do 2da'), ('2do 3ra'), ('2do 4ta'), ('2do 5ta'), ('2do 6ta'), ('2do 7ma'), ('2do 8va'), ('2do 9na'), ('2do 10ma'),
            ('3ro 1ra'), ('3ro 2da'), ('3ro 3ra'), ('3ro 4ta'), ('3ro 5ta'), ('3ro 6ta'), ('3ro 7ma'), ('3ro 8va'), ('3ro 9na'), ('3ro 10ma'),
            ('4to 1ra'), ('4to 2da'), ('4to 3ra'), ('4to 4ta'), ('4to 5ta'), ('4to 6ta'), ('4to 7ma'), ('4to 8va'), ('4to 9na'), ('4to 10ma'),
            ('5to 1ra'), ('5to 2da'), ('5to 3ra'), ('5to 4ta'), ('5to 5ta'), ('5to 6ta'), ('5to 7ma'), ('5to 8va'), ('5to 9na'), ('5to 10ma'),
            ('6to 1ra'), ('6to 2da'), ('6to 3ra'), ('6to 4ta'), ('6to 5ta'), ('6to 6ta'), ('6to 7ma'), ('6to 8va'), ('6to 9na'), ('6to 10ma')
            ON CONFLICT (nombre_curso) DO NOTHING;
        `);
        console.log("🌱 Sembrado de cursos completado.");

        // Sembrado de Períodos Académicos 2026 (Idempotente)
        const existPeriodos = await pool.query('SELECT id FROM periodos_academicos WHERE anio = 2026');
        if (existPeriodos.rows.length === 0) {
            const periodos2026 = [
                { nombre: '1er Bimestre 2026', tipo: 'bimestre', inicio: '2026-03-01', fin: '2026-04-30' },
                { nombre: '2do Bimestre 2026', tipo: 'bimestre', inicio: '2026-05-01', fin: '2026-06-30' },
                { nombre: '3er Bimestre 2026', tipo: 'bimestre', inicio: '2026-07-01', fin: '2026-09-30' },
                { nombre: '4to Bimestre 2026', tipo: 'bimestre', inicio: '2026-10-01', fin: '2026-12-15' },
            ];
            for (const p of periodos2026) {
                await pool.query(
                    `INSERT INTO periodos_academicos (nombre, tipo, fecha_inicio, fecha_fin, anio) VALUES ($1, $2, $3, $4, $5)`,
                    [p.nombre, p.tipo, p.inicio, p.fin, 2026]
                );
            }
            console.log('🌱 Períodos académicos 2026 sembrados.');
        }

        // 12. Sembrado de datos de prueba (solo en desarrollo)
        const saltRounds = 10;
        const isProduction = process.env.NODE_ENV === 'production';

        if (!isProduction) {
            // ─── A. Administradores de prueba (Idempotente) ─────────────────
            const adminsTesting: SeedUserData[] = [
                { correo: 'admin@edutechhub.edu.ar', nombre: 'Administrador General', pass: 'Donpatricio111', dni: 'ADM-001', rol: 'admin' },
                { correo: 'felipelucero534@gmail.com', nombre: 'Felipe Lucero', pass: 'Donpatricio111', dni: 'ADM-OWNER-001', rol: 'admin' },
                { correo: 'felipe.lucero.617@alu.tecnica29de6.edu.ar', nombre: 'Felipe Lucero', pass: 'Donpatricio111', dni: 'ADM-FELIPE-001', rol: 'admin' },
                { correo: 'thiago.said.489@alu.tecnica29de6.edu.ar', nombre: 'Administrador Testing', pass: 'Donpatricio111', dni: 'ADM-TEST-002', rol: 'admin' }
            ];

            for (const adm of adminsTesting) {
                const idUsuario = await upsertUsuario(adm, saltRounds);
                // Limpiar posibles registros desactualizados en alumno
                await pool.query('DELETE FROM alumno WHERE id_usuario = $1', [idUsuario]);
                console.log(`🌱 [DEV] Admin asegurado (ACTIVO): ${adm.correo} [${adm.dni}]`);
            }

            // ─── B. Profesores de prueba (Múltiples materias y profesores) ───
            const profesoresTesting = [
                { correo: 'profesor.matematica@tecnica29de6.edu.ar', nombre: 'Profesor de Matemática', pass: '12345678', dni: 'PROF-MAT-001', materia: 'Matemática' },
                { correo: 'profesor.programacion@tecnica29de6.edu.ar', nombre: 'Profesor de Programación', pass: '12345678', dni: 'PROF-PRG-002', materia: 'Programación' },
                { correo: 'profesor.redes@tecnica29de6.edu.ar', nombre: 'Prof. Martín Redes', pass: '12345678', dni: 'PROF-RED-03', materia: 'Redes' },
                { correo: 'profesor.sistemas@tecnica29de6.edu.ar', nombre: 'Prof. Roberto Sistemas', pass: '12345678', dni: 'PROF-SIS-04', materia: 'Desarrollo de Sistemas' },
                { correo: 'profesor.prueba@tecnica29de6.edu.ar', nombre: 'Profesor Técnico', pass: '12345678', dni: 'PROF-PRUEBA-001', materia: 'Tecnología' },
                { correo: 'profesor.sinclase@tecnica29de6.edu.ar', nombre: 'Profesor Sin Asignar', pass: '12345678', dni: 'PROF-VAC-003', materia: 'Física' }
            ];

            const profesorIdMap: Record<string, number> = {};
            for (const p of profesoresTesting) {
                const idUsuario = await upsertUsuario({
                    correo: p.correo,
                    nombre: p.nombre,
                    pass: p.pass,
                    dni: p.dni,
                    rol: 'profesor',
                    estado_acceso: 'ACTIVO'
                }, saltRounds);

                const hashPass = await bcrypt.hash(p.pass, saltRounds);
                const existProfTable = await pool.query(
                    'SELECT id_profesor FROM profesor WHERE id_usuario = $1 OR DNI = $2 OR LOWER(correo) = $3',
                    [idUsuario, p.dni, p.correo.toLowerCase()]
                );

                if (existProfTable.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO profesor (id_usuario, correo, DNI, nombre_completo, materia, contrasena)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [idUsuario, p.correo.toLowerCase(), p.dni, p.nombre, p.materia, hashPass]
                    );
                } else {
                    await pool.query(
                        `UPDATE profesor 
                         SET id_usuario = $1, correo = $2, DNI = $3, nombre_completo = $4, materia = $5, contrasena = $6 
                         WHERE id_profesor = $7`,
                        [idUsuario, p.correo.toLowerCase(), p.dni, p.nombre, p.materia, hashPass, existProfTable.rows[0].id_profesor]
                    );
                }

                console.log(`🌱 [DEV] Profesor asegurado: ${p.correo} [${p.dni}]`);
                profesorIdMap[p.correo] = idUsuario;
            }

            // ─── C. Alumnos de prueba por División ──────────────────────────
            const alumnosTesting = [
                { correo: 'alumno.3ro1ra@tecnica29de6.edu.ar', nombre: 'Alumno Tres Uno', pass: '123456789', dni: 'ALU-31-001', curso: '3ro 1ra' },
                { correo: 'alumno.4to2da@tecnica29de6.edu.ar', nombre: 'Alumno Cuatro Dos', pass: '123456789', dni: 'ALU-42-002', curso: '4to 2da' },
                { correo: 'alumno.5to1ra@tecnica29de6.edu.ar', nombre: 'Lucas Rodríguez', pass: '123456789', dni: 'ALU-51-003', curso: '5to 1ra' },
                { correo: 'alumno.6to1ra@tecnica29de6.edu.ar', nombre: 'Valentina López', pass: '123456789', dni: 'ALU-61-004', curso: '6to 1ra' },
                { correo: 'alumno.prueba@tecnica29de6.edu.ar', nombre: 'Alumno de Prueba', pass: '123456789', dni: 'ALU-PRUEBA-001', curso: '3ro 1ra' },
                { correo: 'alumno.sinclase@tecnica29de6.edu.ar', nombre: 'Alumno Sin Clases', pass: '123456789', dni: 'ALU-VAC-003', curso: '1ro 1ra' }
            ];

            const alumnoIdMap: Record<string, number> = {};
            for (const a of alumnosTesting) {
                const idUsuario = await upsertUsuario({
                    correo: a.correo,
                    nombre: a.nombre,
                    pass: a.pass,
                    dni: a.dni,
                    rol: 'alumno',
                    curso: a.curso,
                    estado_acceso: 'ACTIVO'
                }, saltRounds);

                const cursoRes = await pool.query('SELECT id_curso FROM curso WHERE nombre_curso = $1', [a.curso]);
                const idCurso = cursoRes.rows.length > 0 ? cursoRes.rows[0].id_curso : null;
                const hashPass = await bcrypt.hash(a.pass, saltRounds);

                const existAlumnoTable = await pool.query(
                    'SELECT id_alumno FROM alumno WHERE id_usuario = $1 OR DNI = $2 OR LOWER(correo) = $3',
                    [idUsuario, a.dni, a.correo.toLowerCase()]
                );

                const partesNombre = a.nombre.split(' ');
                const nombreSolo = partesNombre[0];
                const apellidoSolo = partesNombre.slice(1).join(' ') || '';

                if (existAlumnoTable.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO alumno (DNI, nombre_completo, apellido, id_curso, id_usuario, correo, contrasena)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [a.dni, nombreSolo, apellidoSolo, idCurso, idUsuario, a.correo.toLowerCase(), hashPass]
                    );
                } else {
                    await pool.query(
                        `UPDATE alumno 
                         SET DNI = $1, nombre_completo = $2, apellido = $3, id_curso = $4, id_usuario = $5, correo = $6, contrasena = $7 
                         WHERE id_alumno = $8`,
                        [a.dni, nombreSolo, apellidoSolo, idCurso, idUsuario, a.correo.toLowerCase(), hashPass, existAlumnoTable.rows[0].id_alumno]
                    );
                }

                console.log(`🌱 [DEV] Alumno asegurado (${a.curso}): ${a.correo} [${a.dni}]`);
                alumnoIdMap[a.correo] = idUsuario;
            }

            // ─── D. Clases independientes por División ─────────────────────
            const adminId = (await pool.query("SELECT id_usuario FROM usuarios WHERE rol = 'admin' LIMIT 1")).rows[0]?.id_usuario || null;

            const clasesConfig = [
                {
                    nombre: "Matemática 3ro 1ra",
                    materia: "Matemática",
                    seccion: "3ro 1ra",
                    aula: "Aula 12",
                    codigo: "MAT-31-01",
                    profeCorreo: "profesor.matematica@tecnica29de6.edu.ar",
                    alumnosCorreos: ["alumno.3ro1ra@tecnica29de6.edu.ar", "alumno.prueba@tecnica29de6.edu.ar"]
                },
                {
                    nombre: "Programación 4to 2da",
                    materia: "Programación",
                    seccion: "4to 2da",
                    aula: "Laboratorio 2",
                    codigo: "PRG-42-02",
                    profeCorreo: "profesor.programacion@tecnica29de6.edu.ar",
                    alumnosCorreos: ["alumno.4to2da@tecnica29de6.edu.ar"]
                },
                {
                    nombre: "Redes 5to 1ra",
                    materia: "Redes",
                    seccion: "5to 1ra",
                    aula: "Laboratorio de Redes",
                    codigo: "RED-51-03",
                    profeCorreo: "profesor.redes@tecnica29de6.edu.ar",
                    alumnosCorreos: ["alumno.5to1ra@tecnica29de6.edu.ar"]
                },
                {
                    nombre: "Desarrollo de Sistemas 6to 1ra",
                    materia: "Desarrollo de Sistemas",
                    seccion: "6to 1ra",
                    aula: "Laboratorio 1",
                    codigo: "DDS-61-04",
                    profeCorreo: "profesor.sistemas@tecnica29de6.edu.ar",
                    alumnosCorreos: ["alumno.6to1ra@tecnica29de6.edu.ar"]
                },
                {
                    nombre: "Física 4to 1ra",
                    materia: "Física",
                    seccion: "4to 1ra",
                    aula: "Aula 8",
                    codigo: "FIS-41-05",
                    profeCorreo: null, // 0 profesores asignados
                    alumnosCorreos: []  // 0 alumnos asignados
                },
                {
                    nombre: "Taller de Hardware 2do 1ra",
                    materia: "Hardware",
                    seccion: "2do 1ra",
                    aula: "Taller 3",
                    codigo: "HDW-21-06",
                    profeCorreo: null, // 0 profesores asignados
                    alumnosCorreos: []  // 0 alumnos asignados
                }
            ];

            for (const c of clasesConfig) {
                const titularId = c.profeCorreo ? (profesorIdMap[c.profeCorreo] || null) : null;
                const profeNombre = c.profeCorreo
                    ? profesoresTesting.find(p => p.correo === c.profeCorreo)?.nombre || 'Profesor'
                    : 'Sin Asignar';

                let claseId: number;
                const existClase = await pool.query('SELECT id FROM clases WHERE codigo = $1', [c.codigo]);
                if (existClase.rows.length === 0) {
                    const insertClase = await pool.query(
                        `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                        [c.nombre, c.seccion, c.materia, c.aula, profeNombre, adminId, titularId, c.codigo]
                    );
                    claseId = insertClase.rows[0]?.id || insertClase.insertId;
                    console.log(`🌱 [DEV] Clase sembrada: ${c.nombre} (Titular: ${profeNombre})`);
                } else {
                    claseId = existClase.rows[0].id;
                    await pool.query(
                        `UPDATE clases SET nombre = $1, seccion = $2, materia = $3, aula = $4, titular_id = $5, creador = $6 WHERE id = $7`,
                        [c.nombre, c.seccion, c.materia, c.aula, titularId, profeNombre, claseId]
                    );
                }

                // Asignar en tabla profesores_clases si tiene docente asignado
                if (titularId && claseId) {
                    const existPC = await pool.query(
                        'SELECT id FROM profesores_clases WHERE profesor_id = $1 AND clase_id = $2',
                        [titularId, claseId]
                    );
                    if (existPC.rows.length === 0) {
                        await pool.query(
                            'INSERT INTO profesores_clases (profesor_id, clase_id) VALUES ($1, $2)',
                            [titularId, claseId]
                        );
                    }
                }

                // Inscribir explícitamente solo a sus alumnos asignados
                for (const aluCorreo of c.alumnosCorreos) {
                    const aluId = alumnoIdMap[aluCorreo];
                    if (aluId) {
                        const existEnroll = await pool.query(
                            'SELECT id FROM alumnos_clases WHERE alumno_id = $1 AND LOWER(TRIM(codigo)) = LOWER(TRIM($2))',
                            [aluId, c.codigo]
                        );
                        if (existEnroll.rows.length === 0) {
                            await pool.query(
                                'INSERT INTO alumnos_clases (alumno_id, materia, codigo) VALUES ($1, $2, $3)',
                                [aluId, c.materia, c.codigo]
                            );
                        }
                    }
                }
            }

            // Sembrar trabajos específicos de prueba para Matemática 3ro 1ra si no existen
            const matClase = await pool.query('SELECT id, titular_id FROM clases WHERE codigo = $1', ['MAT-31-01']);
            if (matClase.rows.length > 0) {
                const idMat = matClase.rows[0].id;
                const titularMat = matClase.rows[0].titular_id;
                const existTrabajo = await pool.query('SELECT id FROM trabajos WHERE clase_id = $1', [idMat]);
                if (existTrabajo.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO trabajos (clase_id, titulo, descripcion, instrucciones, fecha_limite, puntos_max, creado_por)
                         VALUES ($1, 'TP 1 - Sistemas de Ecuaciones Lineales', 'Resolver los ejercicios 1 a 5 de la guía práctica.', 'Entregar archivo PDF con procedimiento detallado.', '2026-09-20 23:59:00', 10, $2)`,
                        [idMat, titularMat]
                    );
                    await pool.query(
                        `INSERT INTO trabajos (clase_id, titulo, descripcion, instrucciones, fecha_limite, puntos_max, creado_por)
                         VALUES ($1, 'TP 2 - Funciones Polinómicas y Cuadráticas', 'Graficar raíces y vértices.', 'Subir informe.', '2026-10-05 23:59:00', 10, $2)`,
                        [idMat, titularMat]
                    );
                    console.log('🌱 [DEV] Trabajos de prueba sembrados para Matemática 3ro 1ra.');
                }
            }
        } else {
            console.log('🏭 Modo producción: datos de prueba omitidos.');
        }

        // 13. Sembrado / Aseguramiento de Administradores Principales (Siempre activo e idempotente)
        const adminAccounts: SeedUserData[] = [
            { correo: 'admin@edutechhub.edu.ar', nombre: 'Administrador General', pass: 'Donpatricio111', dni: 'ADM-001', rol: 'admin' },
            { correo: 'felipelucero534@gmail.com', nombre: 'Felipe Lucero', pass: 'Donpatricio111', dni: 'ADM-OWNER-001', rol: 'admin' }
        ];

        if (process.env.ADMIN_EMAIL) {
            const extraEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
            if (!adminAccounts.some(a => a.correo.toLowerCase() === extraEmail)) {
                adminAccounts.push({
                    correo: extraEmail,
                    nombre: 'Administrador del Sistema',
                    pass: process.env.ADMIN_PASSWORD || 'Donpatricio111',
                    dni: 'ADM-ENV-001',
                    rol: 'admin'
                });
            }
        }

        for (const adm of adminAccounts) {
            await upsertUsuario({
                ...adm,
                pass: adm.pass || process.env.ADMIN_PASSWORD || 'Donpatricio111',
                rol: 'admin',
                estado_acceso: 'ACTIVO'
            }, saltRounds);
            console.log(`🔐 Administrador asegurado (ACTIVO): ${adm.correo} [${adm.dni}]`);
        }

        console.log("🚀 Inicialización y sincronización de base de datos finalizada con éxito.");

    } catch (error) {
        console.error("❌ Error al crear tablas o sembrar datos en SQLite:", error);
        throw error;
    }
};

export default crearTablas;
