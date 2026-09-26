-- Migracion: la unicidad de los codigos (patrimonial / inventario, equipo y
-- monitor) solo se validaba en la capa de aplicacion (EquipoEnrichmentService).
-- Se agregan indices UNIQUE filtrados (WHERE ... IS NOT NULL) como ultima
-- linea de defensa a nivel de base de datos, sin bloquear los muchos NULL
-- (SQL Server solo permite un NULL en un UNIQUE normal; el filtro los excluye).
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar indices.

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_equipos_enrichment_codigo_patrimonial')
    CREATE UNIQUE INDEX ux_equipos_enrichment_codigo_patrimonial
        ON dbo.equipos_enrichment(codigo_patrimonial) WHERE codigo_patrimonial IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_equipos_enrichment_codigo_interno')
    CREATE UNIQUE INDEX ux_equipos_enrichment_codigo_interno
        ON dbo.equipos_enrichment(codigo_interno_override) WHERE codigo_interno_override IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_equipos_enrichment_monitor_codigo_patrimonial')
    CREATE UNIQUE INDEX ux_equipos_enrichment_monitor_codigo_patrimonial
        ON dbo.equipos_enrichment(monitor_codigo_patrimonial) WHERE monitor_codigo_patrimonial IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_equipos_enrichment_monitor_codigo_interno')
    CREATE UNIQUE INDEX ux_equipos_enrichment_monitor_codigo_interno
        ON dbo.equipos_enrichment(monitor_codigo_interno_override) WHERE monitor_codigo_interno_override IS NOT NULL;
GO
