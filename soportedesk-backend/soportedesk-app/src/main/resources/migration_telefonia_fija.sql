SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.telefonos_fijos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.telefonos_fijos (
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
        marca NVARCHAR(100) NOT NULL,
        modelo NVARCHAR(150) NOT NULL,
        serie NVARCHAR(100) NULL,
        mac NVARCHAR(17) NULL,
        ip NVARCHAR(45) NULL,
        host NVARCHAR(100) NULL,
        codigo_patrimonial NVARCHAR(50) NULL,
        codigo_inventario NVARCHAR(50) NULL,
        estado NVARCHAR(20) NOT NULL,
        observaciones NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_telefonos_fijos_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,

        CONSTRAINT PK_telefonos_fijos PRIMARY KEY (id),
        CONSTRAINT CK_telefonos_fijos_tipo CHECK (tipo IN ('IP', 'ANALOGICO', 'INALAMBRICO')),
        CONSTRAINT CK_telefonos_fijos_estado CHECK (estado IN (N'Operativo', N'En revisión', N'Inactivo', N'De baja')),
        CONSTRAINT FK_telefonos_fijos_sede FOREIGN KEY (sede_id) REFERENCES dbo.sedes(id),
        CONSTRAINT FK_telefonos_fijos_dependencia FOREIGN KEY (dependencia_id) REFERENCES dbo.dependencias(id),
        CONSTRAINT FK_telefonos_fijos_subdependencia FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias(id)
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_telefonos_fijos_serie'
      AND object_id = OBJECT_ID(N'dbo.telefonos_fijos')
)
    CREATE UNIQUE INDEX UIX_telefonos_fijos_serie
        ON dbo.telefonos_fijos (serie) WHERE serie IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_telefonos_fijos_mac'
      AND object_id = OBJECT_ID(N'dbo.telefonos_fijos')
)
    CREATE UNIQUE INDEX UIX_telefonos_fijos_mac
        ON dbo.telefonos_fijos (mac) WHERE mac IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_telefonos_fijos_ip'
      AND object_id = OBJECT_ID(N'dbo.telefonos_fijos')
)
    CREATE UNIQUE INDEX UIX_telefonos_fijos_ip
        ON dbo.telefonos_fijos (ip) WHERE ip IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_telefonos_fijos_codigo_patrimonial'
      AND object_id = OBJECT_ID(N'dbo.telefonos_fijos')
)
    CREATE UNIQUE INDEX UIX_telefonos_fijos_codigo_patrimonial
        ON dbo.telefonos_fijos (codigo_patrimonial) WHERE codigo_patrimonial IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_telefonos_fijos_codigo_inventario'
      AND object_id = OBJECT_ID(N'dbo.telefonos_fijos')
)
    CREATE UNIQUE INDEX UIX_telefonos_fijos_codigo_inventario
        ON dbo.telefonos_fijos (codigo_inventario) WHERE codigo_inventario IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_telefonos_fijos_tipo'
      AND object_id = OBJECT_ID(N'dbo.telefonos_fijos')
)
    CREATE INDEX IX_telefonos_fijos_tipo ON dbo.telefonos_fijos (tipo);

IF OBJECT_ID(N'dbo.asignaciones_anexo', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.asignaciones_anexo (
        id BIGINT IDENTITY(1,1) NOT NULL,
        telefono_fijo_id BIGINT NOT NULL,
        anexo NVARCHAR(10) NOT NULL,
        numero_directo NVARCHAR(15) NULL,
        persona_nombre NVARCHAR(150) NOT NULL,
        persona_dni NVARCHAR(8) NULL,
        dependencia_id BIGINT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NULL,
        estado NVARCHAR(15) NOT NULL,
        observaciones NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_asig_anexo_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,

        CONSTRAINT PK_asignaciones_anexo PRIMARY KEY (id),
        CONSTRAINT FK_asig_anexo_telefono FOREIGN KEY (telefono_fijo_id) REFERENCES dbo.telefonos_fijos(id),
        CONSTRAINT FK_asig_anexo_dependencia FOREIGN KEY (dependencia_id) REFERENCES dbo.dependencias(id),
        CONSTRAINT CK_asig_anexo_estado CHECK (estado IN (N'Activa', N'Finalizada')),
        CONSTRAINT CK_asig_anexo_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
        CONSTRAINT CK_asig_anexo_finalizada CHECK (estado <> N'Finalizada' OR fecha_fin IS NOT NULL)
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_asig_anexo_anexo_activa'
      AND object_id = OBJECT_ID(N'dbo.asignaciones_anexo')
)
    CREATE UNIQUE INDEX UIX_asig_anexo_anexo_activa
        ON dbo.asignaciones_anexo (anexo) WHERE estado = N'Activa';

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_asig_anexo_numero_activa'
      AND object_id = OBJECT_ID(N'dbo.asignaciones_anexo')
)
    CREATE UNIQUE INDEX UIX_asig_anexo_numero_activa
        ON dbo.asignaciones_anexo (numero_directo)
        WHERE estado = N'Activa' AND numero_directo IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_asig_anexo_telefono'
      AND object_id = OBJECT_ID(N'dbo.asignaciones_anexo')
)
    CREATE INDEX IX_asig_anexo_telefono ON dbo.asignaciones_anexo (telefono_fijo_id);

COMMIT TRANSACTION;
