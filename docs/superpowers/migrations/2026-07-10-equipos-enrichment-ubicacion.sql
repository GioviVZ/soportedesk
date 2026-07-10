-- Migracion: campos de ubicacion (sede/dependencia/subdependencia) y numero de serie
-- override para el enriquecimiento de equipos GLPI.
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas.

IF COL_LENGTH('dbo.equipos_enrichment', 'sede_id') IS NULL
BEGIN
    ALTER TABLE dbo.equipos_enrichment ADD sede_id BIGINT NULL;
    ALTER TABLE dbo.equipos_enrichment ADD CONSTRAINT fk_equipos_enrichment_sede
        FOREIGN KEY (sede_id) REFERENCES dbo.sedes(id);
END;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'dependencia_id') IS NULL
BEGIN
    ALTER TABLE dbo.equipos_enrichment ADD dependencia_id BIGINT NULL;
    ALTER TABLE dbo.equipos_enrichment ADD CONSTRAINT fk_equipos_enrichment_dependencia
        FOREIGN KEY (dependencia_id) REFERENCES dbo.dependencias(id);
END;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'subdependencia_id') IS NULL
BEGIN
    ALTER TABLE dbo.equipos_enrichment ADD subdependencia_id BIGINT NULL;
    ALTER TABLE dbo.equipos_enrichment ADD CONSTRAINT fk_equipos_enrichment_subdependencia
        FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias(id);
END;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'numero_serie_override') IS NULL
BEGIN
    ALTER TABLE dbo.equipos_enrichment ADD numero_serie_override NVARCHAR(100) NULL;
END;
GO

-- Verificacion
SELECT sede_id, dependencia_id, subdependencia_id, numero_serie_override
FROM dbo.equipos_enrichment WHERE 1 = 0;
GO
