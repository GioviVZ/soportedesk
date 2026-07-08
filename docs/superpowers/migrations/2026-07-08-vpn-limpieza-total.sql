-- Limpieza TOTAL de dbo.vpn antes de una nueva carga completa.
-- Ejecutar en: ssti (SQL Server).
-- DESTRUCTIVO: borra TODAS las filas de vpn -- no solo los 405 historicos
-- INTERNO_MANUAL, sino tambien cualquier solicitud real creada despues (aprobadas,
-- pendientes, de prueba). Confirmado explicitamente por el usuario.
--
-- Se usa DELETE en vez de TRUNCATE: dbo.inventario_equipos (tabla externa, ajena a
-- esta aplicacion, con FK_inventario_vpn_relacionado -> vpn.id) tiene una FK que
-- referencia esta tabla, y SQL Server no permite TRUNCATE cuando existe una FK
-- entrante -- sin importar si hay filas dependientes o no. Verificado: 0 filas de
-- inventario_equipos tienen vpn_relacionado_id no nulo, asi que DELETE no viola la
-- FK. A diferencia de TRUNCATE, DELETE no reinicia el contador IDENTITY -- los
-- proximos registros seguiran la numeracion donde quedo, no desde 1.

SELECT COUNT(*) AS antes FROM dbo.vpn;
GO

DELETE FROM dbo.vpn;
GO

SELECT COUNT(*) AS despues FROM dbo.vpn;
GO
