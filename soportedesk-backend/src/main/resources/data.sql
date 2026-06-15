INSERT INTO usuarios (username, password_hash, nombre, rol, activo)
SELECT 'admin', '$2a$10$Wb1iIJ3F3vd9bsZIc0KQfu4nctcPGwl9hzKkfsZbttRXAEbCpUPYi', 'Administrador TI', 'ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin');

INSERT INTO usuarios (username, password_hash, nombre, rol, activo)
SELECT 'soporte', '$2a$10$Wb1iIJ3F3vd9bsZIc0KQfu4nctcPGwl9hzKkfsZbttRXAEbCpUPYi', 'Mesa de Soporte', 'SOPORTE', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'soporte');
