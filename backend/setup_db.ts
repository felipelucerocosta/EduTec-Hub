import pool from './conexion_pg';
import * as bcrypt from 'bcrypt';

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
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
                mensaje TEXT NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

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
                puntos_max INTEGER DEFAULT 100,
                estado TEXT DEFAULT 'publicado',
                creado_por INTEGER,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE,
                FOREIGN KEY(creado_por) REFERENCES usuarios(id_usuario)
            );
        `);

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

        console.log("✅ Estructura de tablas en SQLite verificada/creada correctamente.");

        // 11. Sembrado de Cursos
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

        // 12. Sembrado de datos de prueba (solo en desarrollo)
        const saltRounds = 10;
        const isProduction = process.env.NODE_ENV === 'production';

        if (!isProduction) {
            // Alumno de prueba
            const correoAlumno = 'felipe.lucero.617@alu.tecnica29de6.edu.ar';
            const existAlumno = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correoAlumno]);
            if (existAlumno.rows.length === 0) {
                const hashPass = await bcrypt.hash('123456789', saltRounds);
                const userRes = await pool.query(
                    `INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, curso, rol) 
                     VALUES ($1, $2, $3, $4, $5, 'alumno') RETURNING id_usuario`,
                    [hashPass, 'Felipe Lucero', correoAlumno, '12345678', '3ro A']
                );
                const idUsuario = userRes.rows[0].id_usuario;
                const cursoRes = await pool.query('SELECT id_curso FROM curso WHERE nombre_curso = $1', ['3ro 1ra']);
                const idCurso = cursoRes.rows.length > 0 ? cursoRes.rows[0].id_curso : null;
                await pool.query(
                    `INSERT INTO alumno (DNI, nombre_completo, apellido, id_curso, id_usuario, correo, contrasena)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    ['12345678', 'Felipe', 'Lucero', idCurso, idUsuario, correoAlumno, hashPass]
                );
                console.log(`🌱 [DEV] Alumno de prueba sembrado: ${correoAlumno}`);
            }

            // Profesor de prueba
            const correoProfesor = 'profesor.tecnica@tecnica29de6.edu.ar';
            const existProf = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correoProfesor]);
            if (existProf.rows.length === 0) {
                const hashPass = await bcrypt.hash('12345678', saltRounds);
                const userRes = await pool.query(
                    `INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, curso, rol) 
                     VALUES ($1, $2, $3, $4, $5, 'profesor') RETURNING id_usuario`,
                    [hashPass, 'Profesor Técnico', correoProfesor, '87654321', null]
                );
                const idUsuario = userRes.rows[0].id_usuario;
                await pool.query(
                    `INSERT INTO profesor (id_usuario, correo, DNI, nombre_completo, materia, contrasena)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [idUsuario, correoProfesor, '87654321', 'Profesor Técnico', 'Tecnología', hashPass]
                );
                console.log(`🌱 [DEV] Profesor de prueba sembrado: ${correoProfesor}`);
            }
        } else {
            console.log('🏭 Modo producción: datos de prueba omitidos.');
        }

        // 13. Sembrado de Administrador (tanto del .env como felipelucero534@gmail.com)
        const adminEmails = ['felipelucero534@gmail.com'];
        if (process.env.ADMIN_EMAIL) {
            adminEmails.push(process.env.ADMIN_EMAIL.trim().toLowerCase());
        }
        const adminPass = process.env.ADMIN_PASSWORD || 'Donpatricio111';

        for (const email of adminEmails) {
            const existing = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [email]);
            if (existing.rows.length === 0) {
                const hashed = await bcrypt.hash(adminPass, saltRounds);
                await pool.query(
                    `INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, DNI) 
                     VALUES ($1, $2, $3, 'admin', $4)`,
                    ['Administrador', email, hashed, `DNI-${Math.floor(Math.random() * 10000000)}`]
                );
                console.log(`🔐 Usuario admin creado: ${email}`);
            } else {
                await pool.query(`UPDATE usuarios SET rol = 'admin' WHERE correo = $1`, [email]);
                console.log(`🔐 Rol admin asegurado para: ${email}`);
            }
        }

        // 14. Sembrado de Clases por Defecto (solo en desarrollo)
        if (!isProduction) {
            const clasesDefecto = [
                { nombre: "Redes", materia: "Redes", aula: "Laboratorio de Redes", codigo: "RED-SEC-01" },
                { nombre: "Matemática", materia: "Matemática", aula: "Aula 5", codigo: "MAT-SEC-02" },
                { nombre: "Ciencia y Tecnología", materia: "Ciencia y Tecnología", aula: "Aula 3", codigo: "CYT-SEC-03" },
                { nombre: "Ciudadanía", materia: "Ciudadanía", aula: "Aula 2", codigo: "CIU-SEC-04" },
                { nombre: "Programación sobre Redes", materia: "Programación sobre Redes", aula: "Laboratorio 2", codigo: "PSR-SEC-05" },
                { nombre: "Desarrollo de Sistemas", materia: "Desarrollo de Sistemas", aula: "Laboratorio 1", codigo: "DDS-SEC-06" },
                { nombre: "Prácticas", materia: "Prácticas", aula: "Taller", codigo: "PRA-SEC-07" },
            ];

            for (const c of clasesDefecto) {
                const existClase = await pool.query('SELECT id FROM clases WHERE codigo = $1', [c.codigo]);
                if (existClase.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO clases (nombre, seccion, materia, aula, creador, creador_id, titular_id, codigo)
                         VALUES ($1, 'Secundario', $2, $3, 'Sistema', NULL, NULL, $4)`,
                        [c.nombre, c.materia, c.aula, c.codigo]
                    );
                    console.log(`🌱 [DEV] Clase secundaria sembrada: ${c.nombre}`);
                }
            }
        }

    } catch (error) {
        console.error("❌ Error al crear tablas o sembrar datos en SQLite:", error);
    }
};

export default crearTablas;
