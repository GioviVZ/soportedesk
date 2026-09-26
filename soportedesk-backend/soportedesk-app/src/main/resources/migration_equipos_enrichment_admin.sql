USE ssti;
GO
IF COL_LENGTH('dbo.equipos_enrichment', 'codigo_interno_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD codigo_interno_override NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.equipos_enrichment', 'nombre_asignado_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD nombre_asignado_override NVARCHAR(200) NULL;
GO
IF COL_LENGTH('dbo.equipos_enrichment', 'usuario_asignado_override') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD usuario_asignado_override NVARCHAR(200) NULL;
GO
