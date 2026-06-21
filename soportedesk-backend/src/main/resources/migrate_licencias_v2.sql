-- =============================================================
-- Migración: Rediseño del módulo Licencias
-- Ejecutar manualmente en SSMS contra el servidor 172.16.26.16, base ssti
-- Los datos actuales en dbo.licencias son descartables (confirmado) —
-- este script hace DROP de la tabla y la recrea con la estructura final.
-- =============================================================

USE ssti;
GO

-- ============================================================
-- 1. Catálogos nuevos: tipos_licencia, tipos_bien
-- ============================================================

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

-- ============================================================
-- 2. Tabla licencias: drop-and-recreate (datos descartables)
-- ============================================================

IF OBJECT_ID(N'dbo.licencias', N'U') IS NOT NULL
    DROP TABLE dbo.licencias;
GO

CREATE TABLE dbo.licencias (
    id                 BIGINT         NOT NULL IDENTITY(1,1),
    tipo_licencia_id   BIGINT         NOT NULL,
    descripcion        NVARCHAR(300)  NOT NULL,
    cuenta_activacion  NVARCHAR(200)  NULL,
    clave_activacion   NVARCHAR(1000) NULL,
    serial_activacion  NVARCHAR(200)  NULL,
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

CREATE INDEX IX_licencias_descripcion      ON dbo.licencias (descripcion);
GO
CREATE INDEX IX_licencias_anio              ON dbo.licencias (anio);
GO
CREATE INDEX IX_licencias_tipo_licencia_id  ON dbo.licencias (tipo_licencia_id);
GO
CREATE INDEX IX_licencias_tipo_bien_id      ON dbo.licencias (tipo_bien_id);
GO

-- ============================================================
-- 3. Verificación
-- ============================================================

SELECT * FROM dbo.tipos_licencia;
SELECT * FROM dbo.tipos_bien;
SELECT * FROM dbo.licencias;
GO
