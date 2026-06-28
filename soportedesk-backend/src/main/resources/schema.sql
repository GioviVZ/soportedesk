-- =============================================================
-- Sistema Gestión de Soporte Informático INIA - Schema v1.0 (SQL Server)
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

IF OBJECT_ID(N'dbo.tipos_licencia', N'U') IS NULL
CREATE TABLE dbo.tipos_licencia (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_licencia        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_licencia_nombre UNIQUE      (nombre)
);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Ofimática')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Ofimática');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Diseño')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Diseño');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Edición de Video')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Edición de Video');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Sistema Operativo')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Sistema Operativo');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Antivirus')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Antivirus');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Otro')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Otro');
GO

IF OBJECT_ID(N'dbo.tipos_bien', N'U') IS NULL
CREATE TABLE dbo.tipos_bien (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_bien        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_bien_nombre UNIQUE      (nombre)
);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tipos_bien WHERE nombre = N'Equipo')
    INSERT INTO dbo.tipos_bien (nombre) VALUES (N'Equipo');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_bien WHERE nombre = N'Intangible')
    INSERT INTO dbo.tipos_bien (nombre) VALUES (N'Intangible');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_bien WHERE nombre = N'Servicio')
    INSERT INTO dbo.tipos_bien (nombre) VALUES (N'Servicio');
GO

IF OBJECT_ID(N'dbo.tipos_impresora', N'U') IS NULL
CREATE TABLE dbo.tipos_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_impresora        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_impresora_nombre UNIQUE      (nombre)
);
GO

IF OBJECT_ID(N'dbo.marcas_impresora', N'U') IS NULL
CREATE TABLE dbo.marcas_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_marcas_impresora        PRIMARY KEY (id),
    CONSTRAINT UQ_marcas_impresora_nombre UNIQUE      (nombre)
);
GO

IF OBJECT_ID(N'dbo.modelos_impresora', N'U') IS NULL
CREATE TABLE dbo.modelos_impresora (
    id       BIGINT        NOT NULL IDENTITY(1,1),
    marca_id BIGINT        NOT NULL,
    nombre   NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_modelos_impresora       PRIMARY KEY (id),
    CONSTRAINT FK_modelos_impresora_marca FOREIGN KEY (marca_id) REFERENCES dbo.marcas_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT UQ_modelos_impresora_marca_nombre UNIQUE (marca_id, nombre)
);
GO

IF OBJECT_ID(N'dbo.modelo_impresora_toners', N'U') IS NULL
CREATE TABLE dbo.modelo_impresora_toners (
    id                  BIGINT        NOT NULL IDENTITY(1,1),
    modelo_impresora_id BIGINT        NOT NULL,
    color               NVARCHAR(20)  NOT NULL,
    variante            NVARCHAR(50)  NOT NULL,
    codigo              NVARCHAR(80)  NOT NULL,
    CONSTRAINT PK_modelo_impresora_toners PRIMARY KEY (id),
    CONSTRAINT FK_modelo_impresora_toners_modelo FOREIGN KEY (modelo_impresora_id)
        REFERENCES dbo.modelos_impresora (id) ON DELETE CASCADE,
    CONSTRAINT UQ_modelo_impresora_toners UNIQUE (modelo_impresora_id, color, variante)
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
    nivel      NVARCHAR(10) NOT NULL DEFAULT 'EDIT',
    CONSTRAINT PK_permisos                PRIMARY KEY (id),
    CONSTRAINT UQ_permisos_usuario_modulo UNIQUE      (usuario_id, modulo),
    CONSTRAINT FK_permisos_usuario        FOREIGN KEY (usuario_id)
        REFERENCES dbo.usuarios (id) ON DELETE CASCADE,
    CONSTRAINT CHK_permisos_nivel         CHECK       (nivel IN (N'VIEW', N'EDIT'))
);
GO

IF OBJECT_ID(N'dbo.movimientos_auditoria', N'U') IS NULL
CREATE TABLE dbo.movimientos_auditoria (
    id          BIGINT        NOT NULL IDENTITY(1,1),
    fecha       DATETIME2     NOT NULL,
    usuario     NVARCHAR(80)  NOT NULL,
    accion      NVARCHAR(30)  NOT NULL,
    modulo      NVARCHAR(60)  NOT NULL,
    metodo      NVARCHAR(10)  NOT NULL,
    ruta        NVARCHAR(300) NOT NULL,
    entidad_id  NVARCHAR(80)  NULL,
    estado_http INT           NULL,
    ip          NVARCHAR(80)  NULL,
    detalle     NVARCHAR(500) NULL,
    CONSTRAINT PK_movimientos_auditoria PRIMARY KEY (id)
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
    modelo_impresora_id BIGINT        NOT NULL,
    tipo_impresora_id   BIGINT        NULL,
    serie               NVARCHAR(100) NULL,
    codigo_inventario   NVARCHAR(100) NULL,
    codigo_patrimonial  NVARCHAR(100) NULL,
    tipo_conexion       NVARCHAR(10)  NOT NULL DEFAULT 'USB',
    ip                  NVARCHAR(45)  NULL,
    sede_id             BIGINT        NULL,
    dependencia_id      BIGINT        NULL,
    subdependencia_id   BIGINT        NULL,
    estado              NVARCHAR(30)  NOT NULL,
    driver_nombre       NVARCHAR(200) NULL,
    driver_version      NVARCHAR(50)  NULL,
    driver_so           NVARCHAR(50)  NULL,
    driver_archivo_path NVARCHAR(500) NULL,
    CONSTRAINT PK_impresoras        PRIMARY KEY (id),
    CONSTRAINT FK_impresoras_modelo FOREIGN KEY (modelo_impresora_id) REFERENCES dbo.modelos_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_tipo   FOREIGN KEY (tipo_impresora_id)  REFERENCES dbo.tipos_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
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
    id                 BIGINT         NOT NULL IDENTITY(1,1),
    tipo_licencia_id   BIGINT         NOT NULL,
    descripcion        NVARCHAR(300)  NOT NULL,
    cuenta_activacion  NVARCHAR(200)  NULL,
    clave_activacion   NVARCHAR(1000) NULL,
    serial_activacion  NVARCHAR(MAX)  NULL,
    orden_compra       NVARCHAR(100)  NOT NULL,
    anio               CHAR(4)        NOT NULL,
    cantidad           INT            NOT NULL,
    tipo_bien_id       BIGINT         NOT NULL,
    CONSTRAINT PK_licencias              PRIMARY KEY (id),
    CONSTRAINT CHK_licencias_cantidad    CHECK (cantidad > 0),
    CONSTRAINT CHK_licencias_anio        CHECK (anio LIKE '[0-9][0-9][0-9][0-9]'),
    CONSTRAINT FK_licencias_tipo_licencia FOREIGN KEY (tipo_licencia_id) REFERENCES dbo.tipos_licencia (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_licencias_tipo_bien     FOREIGN KEY (tipo_bien_id)     REFERENCES dbo.tipos_bien (id)     ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

IF OBJECT_ID(N'dbo.licencia_activaciones', N'U') IS NULL
CREATE TABLE dbo.licencia_activaciones (
    id                BIGINT         NOT NULL IDENTITY(1,1),
    licencia_id       BIGINT         NOT NULL,
    cuenta_activacion NVARCHAR(200)  NOT NULL,
    clave_activacion  NVARCHAR(1000) NOT NULL,
    CONSTRAINT PK_licencia_activaciones PRIMARY KEY (id),
    CONSTRAINT FK_licencia_activaciones_licencia FOREIGN KEY (licencia_id)
        REFERENCES dbo.licencias (id) ON DELETE CASCADE
);
GO

-- ============================================================
-- INVENTARIO AUTOMATICO AD
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
    CONSTRAINT FK_inventario_equipo_relacionado FOREIGN KEY (equipo_relacionado_id)
        REFERENCES dbo.equipos (id),
    CONSTRAINT FK_inventario_usuario_red_relacionado FOREIGN KEY (usuario_red_relacionado_id)
        REFERENCES dbo.usuarios_red (id)
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

IF OBJECT_ID(N'dbo.FK_inventario_vpn_relacionado', N'F') IS NULL
ALTER TABLE dbo.inventario_equipos
ADD CONSTRAINT FK_inventario_vpn_relacionado FOREIGN KEY (vpn_relacionado_id)
    REFERENCES dbo.vpn (id);
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
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_movimientos_auditoria_fecha')
    CREATE INDEX IX_movimientos_auditoria_fecha ON dbo.movimientos_auditoria (fecha DESC);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_movimientos_auditoria_usuario')
    CREATE INDEX IX_movimientos_auditoria_usuario ON dbo.movimientos_auditoria (usuario);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_movimientos_auditoria_modulo_accion')
    CREATE INDEX IX_movimientos_auditoria_modulo_accion ON dbo.movimientos_auditoria (modulo, accion);
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_descripcion')      CREATE INDEX IX_licencias_descripcion      ON dbo.licencias (descripcion);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_anio')              CREATE INDEX IX_licencias_anio              ON dbo.licencias (anio);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_tipo_licencia_id')  CREATE INDEX IX_licencias_tipo_licencia_id  ON dbo.licencias (tipo_licencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_tipo_bien_id')      CREATE INDEX IX_licencias_tipo_bien_id      ON dbo.licencias (tipo_bien_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencia_activaciones_licencia_id') CREATE INDEX IX_licencia_activaciones_licencia_id ON dbo.licencia_activaciones (licencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencia_activaciones_cuenta') CREATE INDEX IX_licencia_activaciones_cuenta ON dbo.licencia_activaciones (cuenta_activacion);
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
    VALUES (N'admin', N'$2a$10$jACzX5sAgKRR8uXvQDY5XuF5kwy7R4BCgBRryfXq2zJodAwCsgJQK', N'Administrador TI', N'ADMIN', 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.usuarios WHERE username = N'soporte')
    INSERT INTO dbo.usuarios (username, password_hash, nombre, rol, activo)
    VALUES (N'soporte', N'$2a$10$jACzX5sAgKRR8uXvQDY5XuF5kwy7R4BCgBRryfXq2zJodAwCsgJQK', N'Mesa de Soporte', N'SOPORTE', 1);
GO
