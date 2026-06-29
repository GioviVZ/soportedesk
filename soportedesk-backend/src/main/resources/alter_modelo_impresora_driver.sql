-- ============================================================
-- Mueve el driver de impresora de la unidad individual al modelo.
-- Ver docs/superpowers/specs/2026-06-29-impresoras-driver-por-modelo-design.md
-- Ejecutar manualmente en SSMS. Cada paso es idempotente.
-- ============================================================

USE ssti;
GO

IF COL_LENGTH('dbo.modelos_impresora', 'driver_nombre') IS NULL
    ALTER TABLE dbo.modelos_impresora ADD driver_nombre NVARCHAR(200) NULL;
GO

IF COL_LENGTH('dbo.modelos_impresora', 'driver_version') IS NULL
    ALTER TABLE dbo.modelos_impresora ADD driver_version NVARCHAR(50) NULL;
GO

IF COL_LENGTH('dbo.modelos_impresora', 'driver_so') IS NULL
    ALTER TABLE dbo.modelos_impresora ADD driver_so NVARCHAR(50) NULL;
GO

IF COL_LENGTH('dbo.modelos_impresora', 'driver_archivo_path') IS NULL
    ALTER TABLE dbo.modelos_impresora ADD driver_archivo_path NVARCHAR(500) NULL;
GO

IF COL_LENGTH('dbo.impresoras', 'driver_nombre') IS NOT NULL
    ALTER TABLE dbo.impresoras DROP COLUMN driver_nombre, driver_version, driver_so, driver_archivo_path;
GO

-- Verificacion
SELECT
    (SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('dbo.modelos_impresora') AND name LIKE 'driver_%') AS driver_cols_en_modelo,
    (SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('dbo.impresoras') AND name LIKE 'driver_%') AS driver_cols_en_impresora;
GO
