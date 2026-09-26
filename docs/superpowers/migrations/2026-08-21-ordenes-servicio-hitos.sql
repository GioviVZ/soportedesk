USE ssti;
GO

IF OBJECT_ID(N'dbo.ordenes_servicio_hitos', N'U') IS NULL
CREATE TABLE dbo.ordenes_servicio_hitos (
    id                 BIGINT        NOT NULL IDENTITY(1,1),
    orden_servicio_id  BIGINT        NOT NULL,
    nombre             NVARCHAR(140) NOT NULL,
    dia_plazo          INT           NOT NULL,
    completado         BIT           NOT NULL DEFAULT 0,
    fecha_completado   DATETIME2     NULL,
    CONSTRAINT PK_ordenes_servicio_hitos PRIMARY KEY (id),
    CONSTRAINT FK_ordenes_servicio_hitos_orden FOREIGN KEY (orden_servicio_id)
        REFERENCES dbo.ordenes_servicio (id) ON DELETE CASCADE,
    CONSTRAINT UQ_ordenes_servicio_hitos_dia UNIQUE (orden_servicio_id, dia_plazo),
    CONSTRAINT CHK_ordenes_servicio_hitos_dia CHECK (dia_plazo BETWEEN 1 AND 3650)
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_ordenes_servicio_hitos_estado' AND object_id = OBJECT_ID(N'dbo.ordenes_servicio_hitos'))
    CREATE INDEX IX_ordenes_servicio_hitos_estado
        ON dbo.ordenes_servicio_hitos (orden_servicio_id, completado, dia_plazo);
GO
