-- ============================================================
-- Inventario Automatico AD - Sistema Gestión de Soporte Informático
-- Ejecutar en bases existentes antes de desplegar el agente.
-- ============================================================

IF OBJECT_ID(N'dbo.inventario_equipos', N'U') IS NULL
CREATE TABLE dbo.inventario_equipos (
    id                         BIGINT        NOT NULL IDENTITY(1,1),
    agent_id                   NVARCHAR(80)  NULL,
    hostname                   NVARCHAR(120) NOT NULL,
    serial_equipo              NVARCHAR(120) NULL,
    fabricante                 NVARCHAR(160) NULL,
    modelo                     NVARCHAR(180) NULL,
    dominio                    NVARCHAR(180) NULL,
    ou                         NVARCHAR(500) NULL,
    usuario_actual             NVARCHAR(180) NULL,
    sistema_operativo          NVARCHAR(220) NULL,
    version_sistema            NVARCHAR(100) NULL,
    arquitectura               NVARCHAR(80)  NULL,
    procesador                 NVARCHAR(260) NULL,
    ram_total_bytes            BIGINT        NULL,
    ip_principal               NVARCHAR(80)  NULL,
    mac_principal              NVARCHAR(80)  NULL,
    ultimo_reporte             DATETIME2     NULL,
    ip_reporte                 NVARCHAR(80)  NULL,
    estado_agente              NVARCHAR(40)  NOT NULL CONSTRAINT DF_inventario_estado_agente DEFAULT 'ACTUALIZADO',
    origen                     NVARCHAR(40)  NOT NULL CONSTRAINT DF_inventario_origen DEFAULT 'AGENTE_AD',
    equipo_relacionado_id      BIGINT        NULL,
    usuario_red_relacionado_id BIGINT        NULL,
    vpn_relacionado_id         BIGINT        NULL,
    match_estado               NVARCHAR(40)  NOT NULL CONSTRAINT DF_inventario_match_estado DEFAULT 'SIN_MATCH',
    match_score                INT           NULL CONSTRAINT DF_inventario_match_score DEFAULT 0,
    match_notas                NVARCHAR(500) NULL,
    match_fecha                DATETIME2     NULL,
    CONSTRAINT PK_inventario_equipos PRIMARY KEY (id),
    CONSTRAINT FK_inventario_equipo_relacionado FOREIGN KEY (equipo_relacionado_id) REFERENCES dbo.equipos (id),
    CONSTRAINT FK_inventario_usuario_red_relacionado FOREIGN KEY (usuario_red_relacionado_id) REFERENCES dbo.usuarios_red (id),
    CONSTRAINT FK_inventario_vpn_relacionado FOREIGN KEY (vpn_relacionado_id) REFERENCES dbo.vpn (id)
);
GO

IF OBJECT_ID(N'dbo.inventario_programas', N'U') IS NULL
CREATE TABLE dbo.inventario_programas (
    id                   BIGINT        NOT NULL IDENTITY(1,1),
    inventario_equipo_id BIGINT        NOT NULL,
    nombre               NVARCHAR(300) NOT NULL,
    version              NVARCHAR(120) NULL,
    fabricante           NVARCHAR(220) NULL,
    fecha_instalacion    NVARCHAR(60)  NULL,
    CONSTRAINT PK_inventario_programas PRIMARY KEY (id),
    CONSTRAINT FK_inventario_programas_equipo FOREIGN KEY (inventario_equipo_id)
        REFERENCES dbo.inventario_equipos (id) ON DELETE CASCADE
);
GO

IF OBJECT_ID(N'dbo.inventario_discos', N'U') IS NULL
CREATE TABLE dbo.inventario_discos (
    id                   BIGINT        NOT NULL IDENTITY(1,1),
    inventario_equipo_id BIGINT        NOT NULL,
    letra                NVARCHAR(20)  NULL,
    nombre               NVARCHAR(120) NULL,
    tipo                 NVARCHAR(80)  NULL,
    total_bytes          BIGINT        NULL,
    libre_bytes          BIGINT        NULL,
    CONSTRAINT PK_inventario_discos PRIMARY KEY (id),
    CONSTRAINT FK_inventario_discos_equipo FOREIGN KEY (inventario_equipo_id)
        REFERENCES dbo.inventario_equipos (id) ON DELETE CASCADE
);
GO

IF OBJECT_ID(N'dbo.inventario_redes', N'U') IS NULL
CREATE TABLE dbo.inventario_redes (
    id                   BIGINT        NOT NULL IDENTITY(1,1),
    inventario_equipo_id BIGINT        NOT NULL,
    descripcion          NVARCHAR(260) NULL,
    mac_address          NVARCHAR(80)  NULL,
    CONSTRAINT PK_inventario_redes PRIMARY KEY (id),
    CONSTRAINT FK_inventario_redes_equipo FOREIGN KEY (inventario_equipo_id)
        REFERENCES dbo.inventario_equipos (id) ON DELETE CASCADE
);
GO

IF OBJECT_ID(N'dbo.inventario_red_ips', N'U') IS NULL
CREATE TABLE dbo.inventario_red_ips (
    inventario_red_id BIGINT       NOT NULL,
    ip                NVARCHAR(80) NULL,
    CONSTRAINT FK_inventario_red_ips_red FOREIGN KEY (inventario_red_id)
        REFERENCES dbo.inventario_redes (id) ON DELETE CASCADE
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_inventario_agent_id')       CREATE INDEX IX_inventario_agent_id       ON dbo.inventario_equipos (agent_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_inventario_serial')         CREATE INDEX IX_inventario_serial         ON dbo.inventario_equipos (serial_equipo);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_inventario_hostname')       CREATE INDEX IX_inventario_hostname       ON dbo.inventario_equipos (hostname);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_inventario_dominio')        CREATE INDEX IX_inventario_dominio        ON dbo.inventario_equipos (dominio);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_inventario_ultimo_reporte') CREATE INDEX IX_inventario_ultimo_reporte ON dbo.inventario_equipos (ultimo_reporte);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_inventario_programas_equipo') CREATE INDEX IX_inventario_programas_equipo ON dbo.inventario_programas (inventario_equipo_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_inventario_discos_equipo')    CREATE INDEX IX_inventario_discos_equipo    ON dbo.inventario_discos (inventario_equipo_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_inventario_redes_equipo')     CREATE INDEX IX_inventario_redes_equipo     ON dbo.inventario_redes (inventario_equipo_id);
GO
