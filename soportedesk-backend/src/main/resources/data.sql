-- Usuarios por defecto del sistema
-- Contraseña: admin  (bcrypt $2a$10$...)
-- IMPORTANTE: cambiar password_hash en producción

INSERT INTO usuarios (username, password_hash, nombre, rol, activo)
SELECT 'admin', '$2a$10$eJ6hLkhMposr3/QVM2A2rOt/cka3WviaRvsjlP12LL3se4vX9tKPG', 'Administrador TI', 'ADMIN', 1
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin');

INSERT INTO usuarios (username, password_hash, nombre, rol, activo)
SELECT 'soporte', '$2a$10$eJ6hLkhMposr3/QVM2A2rOt/cka3WviaRvsjlP12LL3se4vX9tKPG', 'Mesa de Soporte', 'SOPORTE', 1
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'soporte');
