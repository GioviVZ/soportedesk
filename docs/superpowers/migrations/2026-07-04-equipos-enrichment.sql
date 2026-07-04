-- Migracion: capa de enriquecimiento de equipos GLPI
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar tablas.

-- 1. Catálogo de tipos de equipo (mapeo GLPI raw → tipo normalizado)
IF OBJECT_ID(N'dbo.equipo_tipo_catalogo', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipo_tipo_catalogo (
        id               BIGINT IDENTITY(1,1) PRIMARY KEY,
        glpi_valor       NVARCHAR(80)  NOT NULL UNIQUE,
        tipo_normalizado NVARCHAR(80)  NOT NULL,
        activo           BIT           NOT NULL DEFAULT 1
    );
END;
GO

-- Datos iniciales
IF NOT EXISTS (SELECT 1 FROM dbo.equipo_tipo_catalogo WHERE glpi_valor = N'Desktop')
BEGIN
    INSERT INTO dbo.equipo_tipo_catalogo (glpi_valor, tipo_normalizado) VALUES
    (N'Desktop',   N'Desktop'),
    (N'PC',        N'Desktop'),
    (N'Notebook',  N'Laptop'),
    (N'Laptop',    N'Laptop'),
    (N'Tablet',    N'Tablet'),
    (N'Server',    N'Servidor'),
    (N'Servidor',  N'Servidor');
END;
GO

-- 2. Enriquecimiento por equipo (un registro por ComputerID GLPI)
IF OBJECT_ID(N'dbo.equipos_enrichment', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipos_enrichment (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        computer_id         BIGINT        NOT NULL UNIQUE,
        tipo_override       NVARCHAR(80)  NULL,
        fabricante_override NVARCHAR(100) NULL,
        modelo_override     NVARCHAR(100) NULL,
        codigo_patrimonial  NVARCHAR(50)  NULL,
        estado_depuracion   NVARCHAR(30)  NULL,
        observaciones       NVARCHAR(500) NULL,
        revisado_por        NVARCHAR(80)  NULL,
        fecha_revision      DATETIME      NULL
    );
END;
GO

-- 3. Historial de cambios por campo
IF OBJECT_ID(N'dbo.equipos_enrichment_historial', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipos_enrichment_historial (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        computer_id         BIGINT        NOT NULL,
        campo               NVARCHAR(80)  NOT NULL,
        valor_anterior      NVARCHAR(500) NULL,
        valor_nuevo         NVARCHAR(500) NULL,
        modificado_por      NVARCHAR(80)  NOT NULL,
        fecha_modificacion  DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX ix_historial_computer_id
        ON dbo.equipos_enrichment_historial(computer_id);
END;
GO

-- Verificación
SELECT 'equipo_tipo_catalogo' AS tabla, COUNT(*) AS filas FROM dbo.equipo_tipo_catalogo
UNION ALL
SELECT 'equipos_enrichment', COUNT(*) FROM dbo.equipos_enrichment
UNION ALL
SELECT 'equipos_enrichment_historial', COUNT(*) FROM dbo.equipos_enrichment_historial;
GO
