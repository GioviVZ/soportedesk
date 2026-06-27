-- Migración: nivel de permiso (VIEW/EDIT) por modulo
-- Fecha: 2026-06-27
-- Ejecutar en la base de datos: ssti (172.16.26.16)

-- 1. Nueva columna; todo lo existente se interpreta como EDIT (preserva el
--    comportamiento actual: hoy un permiso = puede editar).
ALTER TABLE dbo.permisos
  ADD nivel NVARCHAR(10) NOT NULL CONSTRAINT DF_permisos_nivel DEFAULT 'EDIT' WITH VALUES;
GO

ALTER TABLE dbo.permisos
  ADD CONSTRAINT CHK_permisos_nivel CHECK (nivel IN (N'VIEW', N'EDIT'));
GO

-- 2. Los 3 modulos solo-vista nunca tuvieron edicion: corregir su nivel.
UPDATE dbo.permisos
   SET nivel = 'VIEW'
 WHERE modulo IN (N'auditoria', N'herramientas', N'inventario-equipos');
GO

-- 3. Backfill: todo usuario SOPORTE que hoy ve un modulo de edicion sin
--    permiso explicito (porque el GET estaba abierto) recibe VIEW, para no
--    perder acceso al activar la nueva restriccion.
INSERT INTO dbo.permisos (usuario_id, modulo, nivel)
SELECT u.id, m.modulo, 'VIEW'
FROM dbo.usuarios u
CROSS JOIN (VALUES (N'usuarios-red'), (N'correos'), (N'equipos'), (N'vpn'),
                    (N'credenciales-vpn'), (N'impresoras'), (N'wifi'), (N'licencias')) AS m(modulo)
WHERE u.rol = N'SOPORTE'
  AND NOT EXISTS (
    SELECT 1 FROM dbo.permisos p
    WHERE p.usuario_id = u.id AND p.modulo = m.modulo
  );
GO
