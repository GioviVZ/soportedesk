SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.equipos_red', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipos_red (
        id BIGINT IDENTITY(1,1) NOT NULL,
        tipo NVARCHAR(20) NOT NULL,
        sede_id BIGINT NULL,
        dependencia_id BIGINT NULL,
        subdependencia_id BIGINT NULL,
        referencia NVARCHAR(255) NULL,
        latitud DECIMAL(9,6) NULL,
        longitud DECIMAL(9,6) NULL,
        edificio NVARCHAR(100) NULL,
        piso NVARCHAR(50) NULL,
        gabinete NVARCHAR(100) NULL,
        marca NVARCHAR(100) NOT NULL,
        modelo NVARCHAR(150) NOT NULL,
        serie NVARCHAR(100) NULL,
        codigo_patrimonial NVARCHAR(50) NULL,
        codigo_inventario NVARCHAR(50) NULL,
        etiqueta NVARCHAR(100) NULL,
        mac NVARCHAR(17) NULL,
        ip NVARCHAR(45) NULL,
        ip_por_defecto NVARCHAR(45) NULL,
        host NVARCHAR(100) NULL,
        estado NVARCHAR(20) NOT NULL,
        observaciones NVARCHAR(1000) NULL,
        remoto_sede_id BIGINT NULL,
        remoto_referencia NVARCHAR(255) NULL,
        frecuencia_ghz DECIMAL(6,3) NULL,
        ancho_canal_mhz INT NULL,
        ssid_enlace NVARCHAR(64) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_equipos_red_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,

        CONSTRAINT PK_equipos_red PRIMARY KEY (id),
        CONSTRAINT CK_equipos_red_tipo CHECK (tipo IN ('SWITCH', 'ROUTER', 'ACCESS_POINT', 'RADIOENLACE')),
        CONSTRAINT CK_equipos_red_estado CHECK (estado IN (N'Operativo', N'En revisión', N'Inactivo', N'De baja')),
        CONSTRAINT FK_equipos_red_sede FOREIGN KEY (sede_id) REFERENCES dbo.sedes(id),
        CONSTRAINT FK_equipos_red_dependencia FOREIGN KEY (dependencia_id) REFERENCES dbo.dependencias(id),
        CONSTRAINT FK_equipos_red_subdependencia FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias(id),
        CONSTRAINT FK_equipos_red_remoto_sede FOREIGN KEY (remoto_sede_id) REFERENCES dbo.sedes(id)
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_red_serie'
      AND object_id = OBJECT_ID(N'dbo.equipos_red')
)
    CREATE UNIQUE INDEX UIX_equipos_red_serie
        ON dbo.equipos_red (serie) WHERE serie IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_red_codigo_patrimonial'
      AND object_id = OBJECT_ID(N'dbo.equipos_red')
)
    CREATE UNIQUE INDEX UIX_equipos_red_codigo_patrimonial
        ON dbo.equipos_red (codigo_patrimonial) WHERE codigo_patrimonial IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_red_codigo_inventario'
      AND object_id = OBJECT_ID(N'dbo.equipos_red')
)
    CREATE UNIQUE INDEX UIX_equipos_red_codigo_inventario
        ON dbo.equipos_red (codigo_inventario) WHERE codigo_inventario IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_red_ip'
      AND object_id = OBJECT_ID(N'dbo.equipos_red')
)
    CREATE UNIQUE INDEX UIX_equipos_red_ip
        ON dbo.equipos_red (ip) WHERE ip IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_red_mac'
      AND object_id = OBJECT_ID(N'dbo.equipos_red')
)
    CREATE UNIQUE INDEX UIX_equipos_red_mac
        ON dbo.equipos_red (mac) WHERE mac IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_equipos_red_tipo'
      AND object_id = OBJECT_ID(N'dbo.equipos_red')
)
    CREATE INDEX IX_equipos_red_tipo ON dbo.equipos_red (tipo);

COMMIT TRANSACTION;
