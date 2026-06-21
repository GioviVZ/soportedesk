-- =============================================================
-- Migración: ensanchar serial_activacion para soportar varias
-- claves de producto por licencia (una por línea).
-- Ejecutar manualmente en SSMS contra el servidor 172.16.26.16, base ssti.
-- =============================================================

USE ssti;
GO

ALTER TABLE dbo.licencias ALTER COLUMN serial_activacion NVARCHAR(MAX) NULL;
GO

-- Verificación
SELECT name, system_type_name(system_type_id) AS tipo, max_length
FROM sys.dm_exec_describe_first_result_set(N'SELECT serial_activacion FROM dbo.licencias', NULL, 0)
WHERE name = 'serial_activacion';
GO
