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

-- Los modulos solo-vista nunca tuvieron edicion: corregir su nivel.
UPDATE dbo.permisos
   SET nivel = N'VIEW'
 WHERE modulo IN (N'auditoria', N'herramientas');
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

SELECT
    COUNT(*) AS total_permisos,
    SUM(CASE WHEN nivel = N'VIEW' THEN 1 ELSE 0 END) AS permisos_view,
    SUM(CASE WHEN nivel = N'EDIT' THEN 1 ELSE 0 END) AS permisos_edit
FROM dbo.permisos;
GO
