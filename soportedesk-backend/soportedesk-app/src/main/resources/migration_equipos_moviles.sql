SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.equipos_moviles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipos_moviles (
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
        imei1 NVARCHAR(15) NULL,
        imei2 NVARCHAR(15) NULL,
        mac NVARCHAR(17) NULL,
        sistema_operativo NVARCHAR(100) NULL,
        almacenamiento NVARCHAR(50) NULL,
        codigo_patrimonial NVARCHAR(50) NULL,
        codigo_inventario NVARCHAR(50) NULL,
        estado NVARCHAR(20) NOT NULL,
        observaciones NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_equipos_moviles_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,

        CONSTRAINT PK_equipos_moviles PRIMARY KEY (id),
        CONSTRAINT CK_equipos_moviles_tipo CHECK (tipo IN ('SMARTPHONE', 'TABLET', 'MODEM')),
        CONSTRAINT CK_equipos_moviles_estado CHECK (estado IN (N'Operativo', N'En revisión', N'Inactivo', N'De baja')),
        CONSTRAINT FK_equipos_moviles_sede FOREIGN KEY (sede_id) REFERENCES dbo.sedes(id),
        CONSTRAINT FK_equipos_moviles_dependencia FOREIGN KEY (dependencia_id) REFERENCES dbo.dependencias(id),
        CONSTRAINT FK_equipos_moviles_subdependencia FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias(id)
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_moviles_serie'
      AND object_id = OBJECT_ID(N'dbo.equipos_moviles')
)
    CREATE UNIQUE INDEX UIX_equipos_moviles_serie
        ON dbo.equipos_moviles (serie) WHERE serie IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_moviles_imei1'
      AND object_id = OBJECT_ID(N'dbo.equipos_moviles')
)
    CREATE UNIQUE INDEX UIX_equipos_moviles_imei1
        ON dbo.equipos_moviles (imei1) WHERE imei1 IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_moviles_imei2'
      AND object_id = OBJECT_ID(N'dbo.equipos_moviles')
)
    CREATE UNIQUE INDEX UIX_equipos_moviles_imei2
        ON dbo.equipos_moviles (imei2) WHERE imei2 IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_moviles_mac'
      AND object_id = OBJECT_ID(N'dbo.equipos_moviles')
)
    CREATE UNIQUE INDEX UIX_equipos_moviles_mac
        ON dbo.equipos_moviles (mac) WHERE mac IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_moviles_codigo_patrimonial'
      AND object_id = OBJECT_ID(N'dbo.equipos_moviles')
)
    CREATE UNIQUE INDEX UIX_equipos_moviles_codigo_patrimonial
        ON dbo.equipos_moviles (codigo_patrimonial) WHERE codigo_patrimonial IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_equipos_moviles_codigo_inventario'
      AND object_id = OBJECT_ID(N'dbo.equipos_moviles')
)
    CREATE UNIQUE INDEX UIX_equipos_moviles_codigo_inventario
        ON dbo.equipos_moviles (codigo_inventario) WHERE codigo_inventario IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_equipos_moviles_tipo'
      AND object_id = OBJECT_ID(N'dbo.equipos_moviles')
)
    CREATE INDEX IX_equipos_moviles_tipo ON dbo.equipos_moviles (tipo);

IF OBJECT_ID(N'dbo.asignaciones_numero_movil', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.asignaciones_numero_movil (
        id BIGINT IDENTITY(1,1) NOT NULL,
        equipo_movil_id BIGINT NOT NULL,
        numero NVARCHAR(15) NOT NULL,
        operador NVARCHAR(20) NOT NULL,
        plan_nombre NVARCHAR(100) NULL,
        sim_iccid NVARCHAR(22) NULL,
        persona_nombre NVARCHAR(150) NOT NULL,
        persona_dni NVARCHAR(8) NULL,
        dependencia_id BIGINT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NULL,
        estado NVARCHAR(15) NOT NULL,
        observaciones NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_asig_movil_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,

        CONSTRAINT PK_asignaciones_numero_movil PRIMARY KEY (id),
        CONSTRAINT FK_asig_movil_equipo FOREIGN KEY (equipo_movil_id) REFERENCES dbo.equipos_moviles(id),
        CONSTRAINT FK_asig_movil_dependencia FOREIGN KEY (dependencia_id) REFERENCES dbo.dependencias(id),
        CONSTRAINT CK_asig_movil_operador CHECK (operador IN (N'Claro', N'Movistar', N'Entel', N'Bitel', N'Otro')),
        CONSTRAINT CK_asig_movil_estado CHECK (estado IN (N'Activa', N'Finalizada')),
        CONSTRAINT CK_asig_movil_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
        CONSTRAINT CK_asig_movil_finalizada CHECK (estado <> N'Finalizada' OR fecha_fin IS NOT NULL)
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_asig_movil_numero_activa'
      AND object_id = OBJECT_ID(N'dbo.asignaciones_numero_movil')
)
    CREATE UNIQUE INDEX UIX_asig_movil_numero_activa
        ON dbo.asignaciones_numero_movil (numero) WHERE estado = N'Activa';

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_asig_movil_iccid_activa'
      AND object_id = OBJECT_ID(N'dbo.asignaciones_numero_movil')
)
    CREATE UNIQUE INDEX UIX_asig_movil_iccid_activa
        ON dbo.asignaciones_numero_movil (sim_iccid)
        WHERE estado = N'Activa' AND sim_iccid IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_asig_movil_equipo'
      AND object_id = OBJECT_ID(N'dbo.asignaciones_numero_movil')
)
    CREATE INDEX IX_asig_movil_equipo ON dbo.asignaciones_numero_movil (equipo_movil_id);

IF OBJECT_ID(N'dbo.actas_moviles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.actas_moviles (
        id BIGINT IDENTITY(1,1) NOT NULL,
        numero_acta NVARCHAR(50) NOT NULL,
        tipo NVARCHAR(20) NOT NULL,
        fecha DATE NOT NULL,
        persona_nombre NVARCHAR(150) NOT NULL,
        persona_dni NVARCHAR(8) NULL,
        dependencia_id BIGINT NULL,
        observaciones NVARCHAR(1000) NULL,
        archivo_nombre NVARCHAR(255) NULL,
        archivo_ruta NVARCHAR(500) NULL,
        archivo_content_type NVARCHAR(100) NULL,
        archivo_tamano BIGINT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_actas_moviles_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,

        CONSTRAINT PK_actas_moviles PRIMARY KEY (id),
        CONSTRAINT CK_actas_moviles_tipo CHECK (tipo IN (N'Entrega', N'Devolución', N'Transferencia')),
        CONSTRAINT FK_actas_moviles_dependencia FOREIGN KEY (dependencia_id) REFERENCES dbo.dependencias(id)
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UIX_actas_moviles_numero_acta'
      AND object_id = OBJECT_ID(N'dbo.actas_moviles')
)
    CREATE UNIQUE INDEX UIX_actas_moviles_numero_acta ON dbo.actas_moviles (numero_acta);

IF OBJECT_ID(N'dbo.actas_moviles_equipos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.actas_moviles_equipos (
        acta_id BIGINT NOT NULL,
        equipo_movil_id BIGINT NOT NULL,

        CONSTRAINT PK_actas_moviles_equipos PRIMARY KEY (acta_id, equipo_movil_id),
        CONSTRAINT FK_actas_moviles_equipos_acta FOREIGN KEY (acta_id)
            REFERENCES dbo.actas_moviles(id) ON DELETE CASCADE,
        CONSTRAINT FK_actas_moviles_equipos_equipo FOREIGN KEY (equipo_movil_id)
            REFERENCES dbo.equipos_moviles(id)
    );
END;

COMMIT TRANSACTION;
