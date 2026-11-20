-- Tablas para el historial y memoria conversacional de Alfred con Claude AI en PostgreSQL

CREATE TABLE IF NOT EXISTS alfred_conversaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL DEFAULT 'Nueva conversación',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alfred_mensajes (
    id SERIAL PRIMARY KEY,
    conversacion_id INTEGER NOT NULL REFERENCES alfred_conversaciones(id) ON DELETE CASCADE,
    rol VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    contenido TEXT NOT NULL,
    tokens INTEGER DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alfred_conv_user ON alfred_conversaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_alfred_conv_updated ON alfred_conversaciones(actualizado_en DESC);
CREATE INDEX IF NOT EXISTS idx_alfred_msg_conv ON alfred_mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_alfred_msg_created ON alfred_mensajes(creado_en ASC);
