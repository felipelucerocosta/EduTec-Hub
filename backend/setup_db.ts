import pool from './conexion_be';

const crearTablas = async () => {
    console.log("🔄 Inicializando Base de Datos SQLite...");

    try {
        // 1. Tabla USUARIOS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
                dni TEXT,
                nombre_completo TEXT NOT NULL,
                apellido TEXT,
                correo TEXT UNIQUE NOT NULL,
                contrasena TEXT NOT NULL,
                rol TEXT DEFAULT 'alumno',
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Tabla CLASES
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                seccion TEXT,
                materia TEXT NOT NULL,
                aula TEXT,
                creador TEXT NOT NULL,
                codigo TEXT UNIQUE NOT NULL,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Tabla ALUMNOS_CLASES (Inscripciones)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS alumnos_clases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alumno_id INTEGER NOT NULL,
                materia TEXT NOT NULL,
                codigo TEXT NOT NULL,
                fecha_union DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(alumno_id) REFERENCES usuarios(id_usuario)
            );
        `);

        // 4. Tabla ACTAS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS actas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                originalname TEXT NOT NULL,
                path TEXT NOT NULL,
                mimetype TEXT,
                size INTEGER,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 5. Tabla PASSWORD_RESETS (Para Alfred y recuperar contraseña)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT NOT NULL UNIQUE,
                id_usuario INTEGER NOT NULL,
                expires_at DATETIME NOT NULL,
                FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            );
        `);
        
        // 6. Tabla CALENDARIO_NOTAS
        await pool.query(`
             CREATE TABLE IF NOT EXISTS calendario_notas (
                id_nota INTEGER PRIMARY KEY AUTOINCREMENT,
                id_usuario INTEGER,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                fecha_evento DATETIME NOT NULL,
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            );
        `);

        console.log("✅ Tablas creadas o verificadas correctamente.");

    } catch (error) {
        console.error("❌ Error al crear tablas:", error);
    }
};

export default crearTablas;
