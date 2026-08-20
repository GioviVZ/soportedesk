-- Migracion: agrega created_at a equipos_enrichment. Las filas existentes se
-- rellenan con la fecha del primer cambio registrado en el historial (mas
-- preciso que fecha_revision, que refleja el ULTIMO guardado, no el primero).
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar la columna/constraint.

IF COL_LENGTH('dbo.equipos_enrichment', 'created_at') IS NULL
    ALTER TABLE dbo.equipos_enrichment ADD created_at DATETIME NULL;
GO

UPDATE e
SET created_at = COALESCE(
    (SELECT MIN(h.fecha_modificacion) FROM dbo.equipos_enrichment_historial h WHERE h.computer_id = e.computer_id),
    e.fecha_revision,
    GETDATE()
)
FROM dbo.equipos_enrichment e
WHERE e.created_at IS NULL;
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'equipos_enrichment' AND COLUMN_NAME = 'created_at' AND IS_NULLABLE = 'YES')
    ALTER TABLE dbo.equipos_enrichment ALTER COLUMN created_at DATETIME NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'df_equipos_enrichment_created_at')
    ALTER TABLE dbo.equipos_enrichment ADD CONSTRAINT df_equipos_enrichment_created_at DEFAULT GETDATE() FOR created_at;
GO
