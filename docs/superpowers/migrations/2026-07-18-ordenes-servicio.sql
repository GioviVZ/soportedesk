USE ssti;
GO

IF OBJECT_ID(N'dbo.ordenes_servicio', N'U') IS NULL
CREATE TABLE dbo.ordenes_servicio (
    id                BIGINT        NOT NULL IDENTITY(1,1),
    numero_orden      NVARCHAR(100) NOT NULL,
    descripcion       NVARCHAR(300) NOT NULL,
    proveedor         NVARCHAR(200) NULL,
    fecha_inicio      DATE          NOT NULL,
    plazo_dias        INT           NOT NULL,
    fecha_vencimiento DATE          NOT NULL,
    finalizada        BIT           NOT NULL DEFAULT 0,
    registrado_por    NVARCHAR(80)  NOT NULL,
    fecha_registro    DATETIME2     NOT NULL,
    CONSTRAINT PK_ordenes_servicio PRIMARY KEY (id),
    CONSTRAINT UQ_ordenes_servicio_numero UNIQUE (numero_orden),
    CONSTRAINT CHK_ordenes_servicio_plazo CHECK (plazo_dias BETWEEN 0 AND 3650)
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_ordenes_servicio_vencimiento' AND object_id = OBJECT_ID(N'dbo.ordenes_servicio'))
    CREATE INDEX IX_ordenes_servicio_vencimiento ON dbo.ordenes_servicio (finalizada, fecha_vencimiento);
GO
