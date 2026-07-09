-- Migracion: nivel de permiso (VIEW/EDIT) por modulo.
-- Ejecutar en la base de datos: ssti.
-- Idempotente: se puede volver a ejecutar sin duplicar la columna ni el constraint.

IF COL_LENGTH(N'dbo.permisos', N'nivel') IS NULL
BEGIN
    ALTER TABLE dbo.permisos
      ADD nivel NVARCHAR(10) NOT NULL
          CONSTRAINT DF_permisos_nivel DEFAULT 'EDIT' WITH VALUES;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CHK_permisos_nivel'
      AND parent_object_id = OBJECT_ID(N'dbo.permisos')
)
BEGIN
    ALTER TABLE dbo.permisos
      ADD CONSTRAINT CHK_permisos_nivel CHECK (nivel IN (N'VIEW', N'EDIT'));
END;
GO

-- Los modulos solo-vista o solo-consulta no deben quedar como edicion.
UPDATE dbo.permisos
   SET nivel = N'VIEW'
 WHERE modulo IN (N'correos', N'vpn', N'auditoria', N'herramientas');
GO

-- Backfill: todo usuario SOPORTE que no tenga permiso explicito en modulos
-- editables recibe VIEW, para no perder acceso al activar la nueva restriccion.
INSERT INTO dbo.permisos (usuario_id, modulo, nivel)
SELECT u.id, m.modulo, N'VIEW'
FROM dbo.usuarios u
CROSS JOIN (VALUES
    (N'usuarios-red'),
    (N'correos'),
    (N'equipos'),
    (N'vpn'),
    (N'credenciales-vpn'),
    (N'impresoras'),
    (N'wifi'),
    (N'licencias')
) AS m(modulo)
WHERE u.rol = N'SOPORTE'
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.permisos p
    WHERE p.usuario_id = u.id
      AND p.modulo = m.modulo
  );
GO

-- Los permisos finos de VPN necesitan acceso base al modulo para entrar a la pantalla.
INSERT INTO dbo.permisos (usuario_id, modulo, nivel)
SELECT DISTINCT p.usuario_id, N'vpn', N'VIEW'
FROM dbo.permisos p
WHERE p.modulo IN (N'solicitar-vpn', N'aprobar-vpn', N'credenciales-vpn')
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.permisos base
    WHERE base.usuario_id = p.usuario_id
      AND base.modulo = N'vpn'
  );
GO

SELECT
    COUNT(*) AS total_permisos,
    SUM(CASE WHEN nivel = N'VIEW' THEN 1 ELSE 0 END) AS permisos_view,
    SUM(CASE WHEN nivel = N'EDIT' THEN 1 ELSE 0 END) AS permisos_edit
FROM dbo.permisos;
GO
