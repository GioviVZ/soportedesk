-- Migración: Refactor módulo VPN
-- Fecha: 2026-06-16
-- Ejecutar en la base de datos: ssti

-- 1. Eliminar columnas antiguas (texto libre)
ALTER TABLE vpn
  DROP COLUMN usuario,
  DROP COLUMN nombre,
  DROP COLUMN tipo;

-- 2. Agregar nuevas columnas
ALTER TABLE vpn
  ADD COLUMN usuario_red_id BIGINT NULL,
  ADD COLUMN equipo_id      BIGINT NULL,
  ADD COLUMN tiene_antivirus      TINYINT(1) NULL,
  ADD COLUMN vencimiento_antivirus DATE NULL,
  ADD COLUMN usuario_vpn   VARCHAR(255) NULL,
  ADD COLUMN credencial_vpn VARCHAR(255) NULL;

-- 3. Agregar claves foráneas
ALTER TABLE vpn
  ADD CONSTRAINT fk_vpn_usuario_red FOREIGN KEY (usuario_red_id) REFERENCES usuarios_red(id),
  ADD CONSTRAINT fk_vpn_equipo      FOREIGN KEY (equipo_id)      REFERENCES equipos(id);

-- Nota: ip_asignada, vence y estado se mantienen.
-- usuario_red_id es NULL-able para permitir datos existentes;
-- una vez poblados los registros, se puede hacer NOT NULL si se desea.
