import pool from './conexion_pg';
import * as bcrypt from 'bcrypt';

const crearTablas = async () => {
    console.log("🔄 Inicializando Base de Datos (Postgres)...");

    try {
        // 1. Tabla USUARIOS (Postgres)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario SERIAL PRIMARY KEY,
                dni TEXT,
                nombre_completo TEXT NOT NULL,
                apellido TEXT,
                correo TEXT UNIQUE NOT NULL,
                contrasena TEXT NOT NULL,
                rol TEXT DEFAULT 'alumno',
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'alumno';`);

        // 2. Tabla CLASES
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clases (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                seccion TEXT,
                materia TEXT NOT NULL,
                aula TEXT,
                creador TEXT NOT NULL,
                codigo TEXT UNIQUE NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Tabla ALUMNOS_CLASES (Inscripciones)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS alumnos_clases (
                id SERIAL PRIMARY KEY,
                alumno_id INTEGER NOT NULL,
                materia TEXT NOT NULL,
                codigo TEXT NOT NULL,
                fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(alumno_id) REFERENCES usuarios(id_usuario)
            );
        `);

        // 4. Tabla ACTAS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS actas (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL,
                originalname TEXT NOT NULL,
                path TEXT NOT NULL,
                mimetype TEXT,
                size INTEGER,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 5. Tabla PASSWORD_RESETS (Para Alfred y recuperar contraseña)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                token TEXT NOT NULL UNIQUE,
                id_usuario INTEGER NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            );
        `);
        
        // 6. Tabla CALENDARIO_NOTAS
        await pool.query(`
             CREATE TABLE IF NOT EXISTS calendario_notas (
                id_nota SERIAL PRIMARY KEY,
                id_usuario INTEGER,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                fecha_evento TIMESTAMP NOT NULL,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            );
        `);

        // 7. Tabla email_verifications (usada por Alfred)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS email_verifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                code TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT false,
                FOREIGN KEY(user_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            );
        `);

        console.log("✅ Tablas creadas o verificadas correctamente.");

        // Seed admin user si se proveen variables de entorno
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPass = process.env.ADMIN_PASSWORD;
        if (adminEmail && adminPass) {
            const existing = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [adminEmail]);
            if (existing.rows.length === 0) {
                const hashed = await bcrypt.hash(adminPass, 10);
                await pool.query(
                    `INSERT INTO usuarios (nombre_completo, correo, contrasena, rol) VALUES ($1, $2, $3, 'admin')`,
                    ['Administrador', adminEmail, hashed]
                );
                console.log(`🔐 Usuario admin creado: ${adminEmail}`);
            } else {
                // Asegurar que tenga rol admin
                await pool.query(`UPDATE usuarios SET rol = 'admin' WHERE correo = $1`, [adminEmail]);
                console.log(`🔐 Usuario admin asegurado: ${adminEmail}`);
            }
        }

    } catch (error) {
        console.error("❌ Error al crear tablas:", error);
    }
};

export default crearTablas;
