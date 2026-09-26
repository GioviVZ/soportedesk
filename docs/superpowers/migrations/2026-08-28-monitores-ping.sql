-- ============================================================
-- MONITOREO PERSISTENTE DE PING
-- ============================================================

IF OBJECT_ID(N'dbo.monitores_ping', N'U') IS NULL
CREATE TABLE dbo.monitores_ping (
    id                  BIGINT         NOT NULL IDENTITY(1,1),
    nombre              NVARCHAR(80)   NOT NULL,
    host                NVARCHAR(255)  NOT NULL,
    intervalo_segundos  INT            NOT NULL DEFAULT 10,
    estado              NVARCHAR(20)   NOT NULL DEFAULT N'ACTIVO',
    creado_por          NVARCHAR(80)   NOT NULL,
    actualizado_por     NVARCHAR(80)   NOT NULL,
    fecha_creacion      DATETIME2      NOT NULL,
    fecha_actualizacion DATETIME2      NOT NULL,
    ultima_medicion     DATETIME2      NULL,
    proxima_medicion    DATETIME2      NULL,
    ultima_disponible   BIT            NULL,
    ultima_latencia_ms  FLOAT          NULL,
    fallos_consecutivos INT            NOT NULL DEFAULT 0,
    total_muestras      BIGINT         NOT NULL DEFAULT 0,
    total_fallidas      BIGINT         NOT NULL DEFAULT 0,
    version             BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT PK_monitores_ping PRIMARY KEY (id),
    CONSTRAINT UQ_monitores_ping_nombre UNIQUE (nombre),
    CONSTRAINT CHK_monitores_ping_intervalo CHECK (intervalo_segundos BETWEEN 5 AND 3600),
    CONSTRAINT CHK_monitores_ping_estado CHECK (estado IN (N'ACTIVO', N'PAUSADO', N'ARCHIVADO'))
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_monitores_ping_programacion' AND object_id = OBJECT_ID(N'dbo.monitores_ping'))
    CREATE INDEX IX_monitores_ping_programacion ON dbo.monitores_ping (estado, proxima_medicion);
GO

IF OBJECT_ID(N'dbo.monitor_ping_muestras', N'U') IS NULL
CREATE TABLE dbo.monitor_ping_muestras (
    id          BIGINT        NOT NULL IDENTITY(1,1),
    monitor_id  BIGINT        NOT NULL,
    fecha       DATETIME2     NOT NULL,
    disponible  BIT           NOT NULL,
    latencia_ms FLOAT         NULL,
    estado      NVARCHAR(80)  NOT NULL,
    CONSTRAINT PK_monitor_ping_muestras PRIMARY KEY (id),
    CONSTRAINT FK_monitor_ping_muestras_monitor FOREIGN KEY (monitor_id)
        REFERENCES dbo.monitores_ping (id) ON DELETE CASCADE
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_monitor_ping_muestras_monitor_fecha' AND object_id = OBJECT_ID(N'dbo.monitor_ping_muestras'))
    CREATE INDEX IX_monitor_ping_muestras_monitor_fecha
        ON dbo.monitor_ping_muestras (monitor_id, fecha DESC)
        INCLUDE (disponible, latencia_ms);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_monitor_ping_muestras_retencion' AND object_id = OBJECT_ID(N'dbo.monitor_ping_muestras'))
    CREATE INDEX IX_monitor_ping_muestras_retencion ON dbo.monitor_ping_muestras (fecha);
GO

IF OBJECT_ID(N'dbo.monitor_ping_resumen_hora', N'U') IS NULL
CREATE TABLE dbo.monitor_ping_resumen_hora (
    id                    BIGINT NOT NULL IDENTITY(1,1),
    monitor_id            BIGINT NOT NULL,
    hora                  DATETIME2 NOT NULL,
    muestras              BIGINT NOT NULL DEFAULT 0,
    disponibles           BIGINT NOT NULL DEFAULT 0,
    muestras_latencia     BIGINT NOT NULL DEFAULT 0,
    latencia_minima_ms    FLOAT NULL,
    latencia_promedio_ms  FLOAT NULL,
    latencia_maxima_ms    FLOAT NULL,
    CONSTRAINT PK_monitor_ping_resumen_hora PRIMARY KEY (id),
    CONSTRAINT FK_monitor_ping_resumen_monitor FOREIGN KEY (monitor_id)
        REFERENCES dbo.monitores_ping (id) ON DELETE CASCADE,
    CONSTRAINT UQ_monitor_ping_resumen_hora UNIQUE (monitor_id, hora)
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_monitor_ping_resumen_hora_retencion' AND object_id = OBJECT_ID(N'dbo.monitor_ping_resumen_hora'))
    CREATE INDEX IX_monitor_ping_resumen_hora_retencion ON dbo.monitor_ping_resumen_hora (hora);
GO

