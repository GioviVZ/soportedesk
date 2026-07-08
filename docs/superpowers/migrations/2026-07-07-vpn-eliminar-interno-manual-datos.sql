-- Borra los 405 registros historicos con titular_tipo='INTERNO_MANUAL'.
-- Ejecutar en: ssti (SQL Server). NO idempotente en el sentido de "recuperable" -- revisar el
-- conteo antes de confirmar. Correr ANTES del script de DROP COLUMN.

SELECT COUNT(*) AS antes FROM dbo.vpn WHERE titular_tipo = 'INTERNO_MANUAL';
GO

DELETE FROM dbo.vpn WHERE titular_tipo = 'INTERNO_MANUAL';
GO

SELECT COUNT(*) AS despues FROM dbo.vpn WHERE titular_tipo = 'INTERNO_MANUAL';
GO
