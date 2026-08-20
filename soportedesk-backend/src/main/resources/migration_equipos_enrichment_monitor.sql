-- Migracion: campos administrativos del monitor asociado al equipo
-- (marca, modelo, numero de serie, codigo patrimonial, codigo de inventario).
-- GLPI no tiene estos campos para monitores, asi que se guardan localmente
-- en SoporteDesk, igual que ya ocurre con los campos del CPU.
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas.

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor_fabricante_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor_fabricante_override NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor_modelo_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor_modelo_override NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor_numero_serie_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor_numero_serie_override NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor_codigo_patrimonial') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor_codigo_patrimonial NVARCHAR(50) NULL;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor_codigo_interno_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor_codigo_interno_override NVARCHAR(100) NULL;
GO

-- Verificacion
SELECT monitor_fabricante_override, monitor_modelo_override, monitor_numero_serie_override,
       monitor_codigo_patrimonial, monitor_codigo_interno_override
FROM dbo.equipos_enrichment WHERE 1 = 0;
GO
