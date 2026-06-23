-- =============================================================
-- Migracion: elimina la columna nombre de dbo.impresoras.
-- Ejecutar manualmente en SSMS contra la base ssti.
-- =============================================================

USE ssti;
GO

IF COL_LENGTH('dbo.impresoras', 'nombre') IS NOT NULL
BEGIN
    ALTER TABLE dbo.impresoras DROP COLUMN nombre;
END;
GO

-- Verificacion
SELECT
    CASE
        WHEN COL_LENGTH('dbo.impresoras', 'nombre') IS NULL THEN 'OK: columna nombre eliminada'
        ELSE 'PENDIENTE: columna nombre aun existe'
    END AS resultado;
GO
