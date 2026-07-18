USE ssti;
GO
IF OBJECT_ID('dbo.impresoras_intervenciones', 'U') IS NULL
CREATE TABLE dbo.impresoras_intervenciones (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    impresora_id    BIGINT NOT NULL REFERENCES dbo.impresoras(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    observacion     NVARCHAR(1000) NOT NULL,
    registrado_por  NVARCHAR(100) NOT NULL,
    fecha_registro  DATETIME2 NOT NULL
);
GO
CREATE INDEX IX_impresoras_intervenciones_impresora_id
    ON dbo.impresoras_intervenciones(impresora_id);
GO
IF OBJECT_ID('dbo.impresoras_intervenciones_adjuntos', 'U') IS NULL
CREATE TABLE dbo.impresoras_intervenciones_adjuntos (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    intervencion_id BIGINT NOT NULL REFERENCES dbo.impresoras_intervenciones(id) ON DELETE CASCADE,
    archivo_path    NVARCHAR(300) NOT NULL,
    nombre_original NVARCHAR(255) NOT NULL,
    mime_type       NVARCHAR(100) NOT NULL,
    subido_por      NVARCHAR(100) NOT NULL,
    fecha_subida    DATETIME2 NOT NULL
);
GO
CREATE INDEX IX_impresoras_intervenciones_adjuntos_intervencion_id
    ON dbo.impresoras_intervenciones_adjuntos(intervencion_id);
GO
