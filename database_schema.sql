-- Schema for EduTecHub Database
-- Run this in pgAdmin4 to create the necessary tables

-- Main users table
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    contrasena VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    DNI VARCHAR(20) UNIQUE NOT NULL,
    curso VARCHAR(100)
);

-- Courses table
CREATE TABLE IF NOT EXISTS curso (
    id_curso SERIAL PRIMARY KEY,
    nombre_curso VARCHAR(100) UNIQUE NOT NULL
);

-- Students table
CREATE TABLE IF NOT EXISTS alumno (
    id_alumno SERIAL PRIMARY KEY,
    DNI VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    apellido VARCHAR(255),
    id_curso INTEGER REFERENCES curso(id_curso),
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    correo VARCHAR(255) NOT NULL,
    contrasena VARCHAR(255) NOT NULL
);

-- Teachers table
CREATE TABLE IF NOT EXISTS profesor (
    id_profesor SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    correo VARCHAR(255) NOT NULL,
    DNI VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    materia VARCHAR(100),
    contrasena VARCHAR(255) NOT NULL
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    expires_at TIMESTAMP NOT NULL
);

-- Insert sample courses for technical secondary school
-- Years: 1er año to 6to año
-- Divisions: 1ra, 2da, 3ra, 4ta, 5ta, 6ta, 7ma, 8va, 9na, 10ma
INSERT INTO curso (nombre_curso) VALUES
-- 1er año divisions
('1ro 1ra'),
('1ro 2da'),
('1ro 3ra'),
('1ro 4ta'),
('1ro 5ta'),
('1ro 6ta'),
('1ro 7ma'),
('1ro 8va'),
('1ro 9na'),
('1ro 10ma'),
-- 2do año divisions
('2do 1ra'),
('2do 2da'),
('2do 3ra'),
('2do 4ta'),
('2do 5ta'),
('2do 6ta'),
('2do 7ma'),
('2do 8va'),
('2do 9na'),
('2do 10ma'),
-- 3er año divisions
('3ro 1ra'),
('3ro 2da'),
('3ro 3ra'),
('3ro 4ta'),
('3ro 5ta'),
('3ro 6ta'),
('3ro 7ma'),
('3ro 8va'),
('3ro 9na'),
('3ro 10ma'),
-- 4to año divisions
('4to 1ra'),
('4to 2da'),
('4to 3ra'),
('4to 4ta'),
('4to 5ta'),
('4to 6ta'),
('4to 7ma'),
('4to 8va'),
('4to 9na'),
('4to 10ma'),
-- 5to año divisions
('5to 1ra'),
('5to 2da'),
('5to 3ra'),
('5to 4ta'),
('5to 5ta'),
('5to 6ta'),
('5to 7ma'),
('5to 8va'),
('5to 9na'),
('5to 10ma'),
-- 6to año divisions
('6to 1ra'),
('6to 2da'),
('6to 3ra'),
('6to 4ta'),
('6to 5ta'),
('6to 6ta'),
('6to 7ma'),
('6to 8va'),
('6to 9na'),
('6to 10ma')
ON CONFLICT (nombre_curso) DO NOTHING;

-- Insert sample users (optional - for testing)
-- Student
INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, curso) VALUES
('123456789', 'Felipe Lucero', 'felipe.lucero.617@alu.tecnica29de6.edu.ar', '12345678', '3ro A')
ON CONFLICT (correo) DO NOTHING;

-- Teacher
INSERT INTO usuarios (contrasena, nombre_completo, correo, DNI, curso) VALUES
('12345678', 'Profesor Técnico', 'profesor.tecnica@tecnica29de6.edu.ar', '87654321', NULL)
ON CONFLICT (correo) DO NOTHING;
