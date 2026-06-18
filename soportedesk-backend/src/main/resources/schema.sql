-- =============================================================
-- SoporteDesk INIA — Schema v1.0 (SQL Server)
-- Motor: Microsoft SQL Server 2016+
-- Ejecutar en SSMS conectado al servidor (master o ssti)
-- =============================================================

-- ============================================================
-- BASE DE DATOS
-- ============================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ssti')
BEGIN
    CREATE DATABASE ssti COLLATE Latin1_General_CI_AI;
END;
GO

USE ssti;
GO

-- ============================================================
-- CATÁLOGOS BASE
-- ============================================================

IF OBJECT_ID(N'dbo.sedes', N'U') IS NULL
CREATE TABLE dbo.sedes (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(150) NOT NULL,
    CONSTRAINT PK_sedes        PRIMARY KEY (id),
    CONSTRAINT UQ_sedes_nombre UNIQUE      (nombre)
);
GO

IF OBJECT_ID(N'dbo.tipos_contrato', N'U') IS NULL
CREATE TABLE dbo.tipos_contrato (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_contrato        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_contrato_nombre UNIQUE      (nombre)
);
GO

IF OBJECT_ID(N'dbo.dependencias', N'U') IS NULL
CREATE TABLE dbo.dependencias (
    id      BIGINT        NOT NULL IDENTITY(1,1),
    nombre  NVARCHAR(150) NOT NULL,
    sede_id BIGINT        NOT NULL,
    CONSTRAINT PK_dependencias      PRIMARY KEY (id),
    CONSTRAINT FK_dependencias_sede FOREIGN KEY (sede_id)
        REFERENCES dbo.sedes (id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

IF OBJECT_ID(N'dbo.subdependencias', N'U') IS NULL
CREATE TABLE dbo.subdependencias (
    id             BIGINT        NOT NULL IDENTITY(1,1),
    nombre         NVARCHAR(150) NOT NULL,
    dependencia_id BIGINT        NOT NULL,
    CONSTRAINT PK_subdependencias             PRIMARY KEY (id),
    CONSTRAINT FK_subdependencias_dependencia FOREIGN KEY (dependencia_id)
        REFERENCES dbo.dependencias (id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
-- USUARIOS DEL SISTEMA
-- ============================================================

IF OBJECT_ID(N'dbo.usuarios', N'U') IS NULL
CREATE TABLE dbo.usuarios (
    id            BIGINT        NOT NULL IDENTITY(1,1),
    username      NVARCHAR(80)  NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    nombre        NVARCHAR(150) NOT NULL,
    rol           NVARCHAR(10)  NOT NULL,
    activo        BIT           NOT NULL DEFAULT 1,
    CONSTRAINT PK_usuarios          PRIMARY KEY (id),
    CONSTRAINT UQ_usuarios_username UNIQUE      (username),
    CONSTRAINT CHK_usuarios_rol     CHECK       (rol IN (N'ADMIN', N'SOPORTE'))
);
GO

IF OBJECT_ID(N'dbo.permisos', N'U') IS NULL
CREATE TABLE dbo.permisos (
    id         BIGINT       NOT NULL IDENTITY(1,1),
    usuario_id BIGINT       NOT NULL,
    modulo     NVARCHAR(50) NOT NULL,
    CONSTRAINT PK_permisos                PRIMARY KEY (id),
    CONSTRAINT UQ_permisos_usuario_modulo UNIQUE      (usuario_id, modulo),
    CONSTRAINT FK_permisos_usuario        FOREIGN KEY (usuario_id)
        REFERENCES dbo.usuarios (id) ON DELETE CASCADE
);
GO

-- ============================================================
-- USUARIOS DE RED / ACTIVE DIRECTORY
-- ============================================================

IF OBJECT_ID(N'dbo.usuarios_red', N'U') IS NULL
CREATE TABLE dbo.usuarios_red (
    id                 BIGINT        NOT NULL IDENTITY(1,1),
    usuario            NVARCHAR(100) NOT NULL,
    nombre             NVARCHAR(150) NOT NULL,
    apellidos          NVARCHAR(150) NOT NULL,
    grupo              NVARCHAR(100) NOT NULL,
    unidad_organizativa NVARCHAR(150) NULL,
    ultimo_login       DATETIME2     NULL,
    estado             NVARCHAR(30)  NOT NULL,
    sede_id            BIGINT        NOT NULL,
    dependencia_id     BIGINT        NOT NULL,
    subdependencia_id  BIGINT        NOT NULL,
    tipo_contrato_id   BIGINT        NOT NULL,
    fecha_fin_contrato DATE          NULL,
    fecha_creacion     DATE          NULL,
    numero_contrato    NVARCHAR(100) NULL,
    CONSTRAINT PK_usuarios_red             PRIMARY KEY (id),
    CONSTRAINT UQ_usuarios_red_usuario     UNIQUE      (usuario),
    CONSTRAINT FK_usuarios_red_sede        FOREIGN KEY (sede_id)           REFERENCES dbo.sedes (id)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_usuarios_red_dependencia FOREIGN KEY (dependencia_id)    REFERENCES dbo.dependencias (id)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_usuarios_red_subdep      FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_usuarios_red_contrato    FOREIGN KEY (tipo_contrato_id)  REFERENCES dbo.tipos_contrato (id)  ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
-- EQUIPOS DE CÓMPUTO
-- ============================================================

IF OBJECT_ID(N'dbo.equipos', N'U') IS NULL
CREATE TABLE dbo.equipos (
    id                  BIGINT        NOT NULL IDENTITY(1,1),
    numero_serie        NVARCHAR(100) NULL,
    codigo_patrimonial  NVARCHAR(80)  NULL,
    codigo_inventario   NVARCHAR(80)  NULL,
    tipo                NVARCHAR(50)  NOT NULL,
    marca               NVARCHAR(80)  NOT NULL,
    modelo              NVARCHAR(100) NOT NULL,
    host                NVARCHAR(100) NULL,
    ip                  NVARCHAR(45)  NULL,
    usuario_red_id      BIGINT        NULL,
    sede_id             BIGINT        NULL,
    dependencia_id      BIGINT        NULL,
    subdependencia_id   BIGINT        NULL,
    asignado            DATE          NULL,
    estado              NVARCHAR(30)  NOT NULL,
    CONSTRAINT PK_equipos             PRIMARY KEY (id),
    CONSTRAINT FK_equipos_usuario_red FOREIGN KEY (usuario_red_id)    REFERENCES dbo.usuarios_red (id)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_equipos_sede        FOREIGN KEY (sede_id)           REFERENCES dbo.sedes (id)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_equipos_dependencia FOREIGN KEY (dependencia_id)    REFERENCES dbo.dependencias (id)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_equipos_subdep      FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias (id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Unique filtrado: permite múltiples NULLs en numero_serie
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'UIX_equipos_numero_serie' AND object_id = OBJECT_ID(N'dbo.equipos'))
    CREATE UNIQUE INDEX UIX_equipos_numero_serie ON dbo.equipos (numero_serie) WHERE numero_serie IS NOT NULL;
GO

-- ============================================================
-- IMPRESORAS
-- ============================================================

IF OBJECT_ID(N'dbo.impresoras', N'U') IS NULL
CREATE TABLE dbo.impresoras (
    id                  BIGINT        NOT NULL IDENTITY(1,1),
    nombre              NVARCHAR(150) NOT NULL,
    marca               NVARCHAR(80)  NOT NULL,
    modelo              NVARCHAR(100) NOT NULL,
    ip                  NVARCHAR(45)  NULL,
    sede_id             BIGINT        NULL,
    dependencia_id      BIGINT        NULL,
    subdependencia_id   BIGINT        NULL,
    estado              NVARCHAR(30)  NOT NULL,
    modelo_toner_negro  NVARCHAR(80)  NULL,
    modelo_toner_c      NVARCHAR(80)  NULL,
    modelo_toner_m      NVARCHAR(80)  NULL,
    modelo_toner_y      NVARCHAR(80)  NULL,
    modelo_cartucho     NVARCHAR(80)  NULL,
    modelo_drum         NVARCHAR(80)  NULL,
    modelo_fusor        NVARCHAR(80)  NULL,
    driver_nombre       NVARCHAR(200) NULL,
    driver_version      NVARCHAR(50)  NULL,
    driver_so           NVARCHAR(50)  NULL,
    driver_archivo_path NVARCHAR(500) NULL,
    CONSTRAINT PK_impresoras        PRIMARY KEY (id),
    CONSTRAINT FK_impresoras_sede   FOREIGN KEY (sede_id)           REFERENCES dbo.sedes (id)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_dep    FOREIGN KEY (dependencia_id)    REFERENCES dbo.dependencias (id)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_subdep FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias (id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
-- CORREOS INSTITUCIONALES
-- ============================================================

IF OBJECT_ID(N'dbo.correos', N'U') IS NULL
CREATE TABLE dbo.correos (
    id                 BIGINT        NOT NULL IDENTITY(1,1),
    usuario            NVARCHAR(100) NOT NULL,
    nombre             NVARCHAR(150) NOT NULL,
    apellidos          NVARCHAR(150) NOT NULL,
    correo             NVARCHAR(200) NOT NULL,
    estado             NVARCHAR(30)  NOT NULL,
    sede_id            BIGINT        NOT NULL,
    dependencia_id     BIGINT        NOT NULL,
    subdependencia_id  BIGINT        NOT NULL,
    tipo_contrato_id   BIGINT        NOT NULL,
    fecha_fin_contrato DATE          NULL,
    creado             DATE          NOT NULL,
    CONSTRAINT PK_correos          PRIMARY KEY (id),
    CONSTRAINT UQ_correos_correo   UNIQUE      (correo),
    CONSTRAINT FK_correos_sede     FOREIGN KEY (sede_id)           REFERENCES dbo.sedes (id)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_correos_dep      FOREIGN KEY (dependencia_id)    REFERENCES dbo.dependencias (id)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_correos_subdep   FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_correos_contrato FOREIGN KEY (tipo_contrato_id)  REFERENCES dbo.tipos_contrato (id)  ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
-- LICENCIAS DE SOFTWARE
-- ============================================================

IF OBJECT_ID(N'dbo.licencias', N'U') IS NULL
CREATE TABLE dbo.licencias (
    id           BIGINT        NOT NULL IDENTITY(1,1),
    cantidad     INT           NOT NULL,
    licencia     NVARCHAR(200) NOT NULL,
    correo       NVARCHAR(200) NOT NULL,
    clave        NVARCHAR(500) NOT NULL,
    orden_compra NVARCHAR(100) NOT NULL,
    anio         CHAR(4)       NOT NULL,
    CONSTRAINT PK_licencias           PRIMARY KEY (id),
    CONSTRAINT CHK_licencias_cantidad CHECK (cantidad > 0),
    CONSTRAINT CHK_licencias_anio     CHECK (anio LIKE '[0-9][0-9][0-9][0-9]')
);
GO

-- ============================================================
-- VPN
-- ============================================================

IF OBJECT_ID(N'dbo.vpn', N'U') IS NULL
CREATE TABLE dbo.vpn (
    id                    BIGINT        NOT NULL IDENTITY(1,1),
    usuario_red_id        BIGINT        NULL,
    equipo_id             BIGINT        NULL,
    ip_asignada           NVARCHAR(45)  NULL,
    vence                 DATE          NULL,
    estado                NVARCHAR(30)  NOT NULL,
    tiene_antivirus       BIT           NULL,
    vencimiento_antivirus DATE          NULL,
    usuario_vpn           NVARCHAR(100) NULL,
    credencial_vpn        NVARCHAR(200) NULL,
    CONSTRAINT PK_vpn             PRIMARY KEY (id),
    CONSTRAINT FK_vpn_usuario_red FOREIGN KEY (usuario_red_id) REFERENCES dbo.usuarios_red (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_vpn_equipo      FOREIGN KEY (equipo_id)      REFERENCES dbo.equipos (id)      ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
-- REDES WIFI
-- ============================================================

IF OBJECT_ID(N'dbo.wifi', N'U') IS NULL
CREATE TABLE dbo.wifi (
    id        BIGINT        NOT NULL IDENTITY(1,1),
    ssid      NVARCHAR(100) NOT NULL,
    clave     NVARCHAR(200) NOT NULL,
    ubicacion NVARCHAR(150) NOT NULL,
    tipo      NVARCHAR(50)  NOT NULL,
    estado    NVARCHAR(30)  NOT NULL,
    CONSTRAINT PK_wifi PRIMARY KEY (id)
);
GO

-- ============================================================
-- ÍNDICES
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_dependencias_sede_id')
    CREATE INDEX IX_dependencias_sede_id ON dbo.dependencias (sede_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_subdependencias_dependencia_id')
    CREATE INDEX IX_subdependencias_dependencia_id ON dbo.subdependencias (dependencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_permisos_usuario_id')
    CREATE INDEX IX_permisos_usuario_id ON dbo.permisos (usuario_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_usuarios_red_sede_id')         CREATE INDEX IX_usuarios_red_sede_id         ON dbo.usuarios_red (sede_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_usuarios_red_dependencia_id')  CREATE INDEX IX_usuarios_red_dependencia_id  ON dbo.usuarios_red (dependencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_usuarios_red_subdependencia_id') CREATE INDEX IX_usuarios_red_subdependencia_id ON dbo.usuarios_red (subdependencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_usuarios_red_tipo_contrato_id') CREATE INDEX IX_usuarios_red_tipo_contrato_id ON dbo.usuarios_red (tipo_contrato_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_usuarios_red_estado')           CREATE INDEX IX_usuarios_red_estado           ON dbo.usuarios_red (estado);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_usuarios_red_nombre')           CREATE INDEX IX_usuarios_red_nombre           ON dbo.usuarios_red (nombre);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_equipos_usuario_red_id')    CREATE INDEX IX_equipos_usuario_red_id    ON dbo.equipos (usuario_red_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_equipos_sede_id')           CREATE INDEX IX_equipos_sede_id           ON dbo.equipos (sede_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_equipos_dependencia_id')    CREATE INDEX IX_equipos_dependencia_id    ON dbo.equipos (dependencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_equipos_subdependencia_id') CREATE INDEX IX_equipos_subdependencia_id ON dbo.equipos (subdependencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_equipos_tipo')              CREATE INDEX IX_equipos_tipo              ON dbo.equipos (tipo);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_equipos_estado')            CREATE INDEX IX_equipos_estado            ON dbo.equipos (estado);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_equipos_marca_modelo')      CREATE INDEX IX_equipos_marca_modelo      ON dbo.equipos (marca, modelo);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_impresoras_sede_id')           CREATE INDEX IX_impresoras_sede_id           ON dbo.impresoras (sede_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_impresoras_dependencia_id')    CREATE INDEX IX_impresoras_dependencia_id    ON dbo.impresoras (dependencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_impresoras_subdependencia_id') CREATE INDEX IX_impresoras_subdependencia_id ON dbo.impresoras (subdependencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_impresoras_estado')            CREATE INDEX IX_impresoras_estado            ON dbo.impresoras (estado);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_impresoras_marca_modelo')      CREATE INDEX IX_impresoras_marca_modelo      ON dbo.impresoras (marca, modelo);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_correos_sede_id')           CREATE INDEX IX_correos_sede_id           ON dbo.correos (sede_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_correos_dependencia_id')    CREATE INDEX IX_correos_dependencia_id    ON dbo.correos (dependencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_correos_subdependencia_id') CREATE INDEX IX_correos_subdependencia_id ON dbo.correos (subdependencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_correos_tipo_contrato_id')  CREATE INDEX IX_correos_tipo_contrato_id  ON dbo.correos (tipo_contrato_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_correos_estado')            CREATE INDEX IX_correos_estado            ON dbo.correos (estado);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_correos_nombre')            CREATE INDEX IX_correos_nombre            ON dbo.correos (nombre);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_licencia') CREATE INDEX IX_licencias_licencia ON dbo.licencias (licencia);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_anio')     CREATE INDEX IX_licencias_anio     ON dbo.licencias (anio);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_vpn_usuario_red_id')        CREATE INDEX IX_vpn_usuario_red_id        ON dbo.vpn (usuario_red_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_vpn_equipo_id')             CREATE INDEX IX_vpn_equipo_id             ON dbo.vpn (equipo_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_vpn_estado')                CREATE INDEX IX_vpn_estado                ON dbo.vpn (estado);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_vpn_vence')                 CREATE INDEX IX_vpn_vence                 ON dbo.vpn (vence);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_vpn_vencimiento_antivirus') CREATE INDEX IX_vpn_vencimiento_antivirus ON dbo.vpn (vencimiento_antivirus);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_wifi_ssid')   CREATE INDEX IX_wifi_ssid   ON dbo.wifi (ssid);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_wifi_estado') CREATE INDEX IX_wifi_estado ON dbo.wifi (estado);
GO

-- ============================================================
-- DATOS INICIALES
-- Contraseña por defecto: admin  (bcrypt)
-- IMPORTANTE: cambiar en producción
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM dbo.usuarios WHERE username = N'admin')
    INSERT INTO dbo.usuarios (username, password_hash, nombre, rol, activo)
    VALUES (N'admin', N'$2a$10$eJ6hLkhMposr3/QVM2A2rOt/cka3WviaRvsjlP12LL3se4vX9tKPG', N'Administrador TI', N'ADMIN', 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.usuarios WHERE username = N'soporte')
    INSERT INTO dbo.usuarios (username, password_hash, nombre, rol, activo)
    VALUES (N'soporte', N'$2a$10$eJ6hLkhMposr3/QVM2A2rOt/cka3WviaRvsjlP12LL3se4vX9tKPG', N'Mesa de Soporte', N'SOPORTE', 1);
GO
