-- ============================================================
-- Catalogo Marca -> Modelo -> Toner de Impresoras
-- Ejecutar manualmente en SSMS antes de desplegar el backend actualizado.
-- Cada paso es idempotente (se puede volver a correr el script completo
-- aunque una corrida anterior haya quedado a mitad de camino).
-- ============================================================

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

-- dbo.impresoras solo tenia datos de prueba sin valor real (confirmado) --
-- se vacia para poder agregar modelo_impresora_id como NOT NULL sin backfill.
DELETE FROM dbo.impresoras;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_impresoras_marca_modelo')
    DROP INDEX IX_impresoras_marca_modelo ON dbo.impresoras;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.impresoras') AND name = 'marca')
BEGIN
    ALTER TABLE dbo.impresoras DROP COLUMN marca, modelo, modelo_toner_negro, modelo_toner_c, modelo_toner_m, modelo_toner_y;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.impresoras') AND name = 'modelo_impresora_id')
BEGIN
    ALTER TABLE dbo.impresoras ADD modelo_impresora_id BIGINT NOT NULL
        CONSTRAINT FK_impresoras_modelo FOREIGN KEY REFERENCES dbo.modelos_impresora (id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_impresoras_modelo_impresora_id')
    CREATE INDEX IX_impresoras_modelo_impresora_id ON dbo.impresoras (modelo_impresora_id);
GO
