-- Migracion: campos administrativos del SEGUNDO monitor (algunos equipos
-- tienen dos, segun GLPI). Mismo patron que monitor_* (primer monitor).
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas/indices.

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor2_fabricante_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor2_fabricante_override NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor2_modelo_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor2_modelo_override NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor2_numero_serie_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor2_numero_serie_override NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor2_codigo_patrimonial') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor2_codigo_patrimonial NVARCHAR(50) NULL;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'monitor2_codigo_interno_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD monitor2_codigo_interno_override NVARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_equipos_enrichment_monitor2_codigo_patrimonial')
    CREATE UNIQUE INDEX ux_equipos_enrichment_monitor2_codigo_patrimonial
        ON dbo.equipos_enrichment(monitor2_codigo_patrimonial) WHERE monitor2_codigo_patrimonial IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_equipos_enrichment_monitor2_codigo_interno')
    CREATE UNIQUE INDEX ux_equipos_enrichment_monitor2_codigo_interno
        ON dbo.equipos_enrichment(monitor2_codigo_interno_override) WHERE monitor2_codigo_interno_override IS NOT NULL;
GO
