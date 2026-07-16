USE ssti;
GO
IF OBJECT_ID('dbo.equipos_evidencias', 'U') IS NULL
CREATE TABLE dbo.equipos_evidencias (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    computer_id     BIGINT NOT NULL,
    archivo_path    NVARCHAR(300) NOT NULL,
    nombre_original NVARCHAR(255) NOT NULL,
    mime_type       NVARCHAR(100) NOT NULL,
    descripcion     NVARCHAR(500) NULL,
    subido_por      NVARCHAR(100) NOT NULL,
    fecha_subida    DATETIME2 NOT NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_equipos_evidencias_computer_id')
CREATE INDEX IX_equipos_evidencias_computer_id ON dbo.equipos_evidencias(computer_id);
GO
