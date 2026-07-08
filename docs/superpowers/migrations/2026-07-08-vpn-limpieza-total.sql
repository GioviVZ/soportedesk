-- Limpieza TOTAL de dbo.vpn antes de una nueva carga completa.
-- Ejecutar en: ssti (SQL Server).
-- DESTRUCTIVO: borra TODAS las filas de vpn -- no solo los 405 historicos
-- INTERNO_MANUAL, sino tambien cualquier solicitud real creada despues (aprobadas,
-- pendientes, de prueba). Confirmado explicitamente por el usuario.
-- TRUNCATE reinicia el contador IDENTITY de vuelta a 1 (arranque limpio para la
-- nueva carga). Verificado: ninguna otra tabla tiene FK hacia dbo.vpn, por lo que
-- TRUNCATE es seguro aqui.

SELECT COUNT(*) AS antes FROM dbo.vpn;
GO

TRUNCATE TABLE dbo.vpn;
GO

SELECT COUNT(*) AS despues FROM dbo.vpn;
GO
