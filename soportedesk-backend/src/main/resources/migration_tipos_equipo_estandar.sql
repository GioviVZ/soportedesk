USE ssti;
GO
UPDATE dbo.equipo_tipo_catalogo SET tipo_normalizado=N'Computadora de Escritorio', activo=1 WHERE glpi_valor IN (N'Desktop',N'PC');
UPDATE dbo.equipo_tipo_catalogo SET tipo_normalizado=N'Laptop', activo=1 WHERE glpi_valor IN (N'Laptop',N'Notebook');
UPDATE dbo.equipo_tipo_catalogo SET tipo_normalizado=N'All in One', activo=1 WHERE glpi_valor IN (N'Space-Saving',N'All in One',N'All-in-One');
UPDATE dbo.equipo_tipo_catalogo SET activo=0 WHERE glpi_valor IN (N'Tablet',N'Server',N'Servidor');
IF NOT EXISTS (SELECT 1 FROM dbo.equipo_tipo_catalogo WHERE glpi_valor=N'Low Profile Desktop') INSERT dbo.equipo_tipo_catalogo(glpi_valor,tipo_normalizado,activo) VALUES(N'Low Profile Desktop',N'Computadora de Escritorio',1);
IF NOT EXISTS (SELECT 1 FROM dbo.equipo_tipo_catalogo WHERE glpi_valor=N'Mini PC') INSERT dbo.equipo_tipo_catalogo(glpi_valor,tipo_normalizado,activo) VALUES(N'Mini PC',N'Computadora de Escritorio',1);
GO
