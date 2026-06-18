-- =============================================================
-- Agrega unidad_organizativa a usuarios_red
-- Ejecutar en SSMS contra la BD ssti
-- =============================================================
USE ssti;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.usuarios_red') AND name = 'unidad_organizativa'
)
    ALTER TABLE dbo.usuarios_red ADD unidad_organizativa NVARCHAR(150) NULL;
GO
