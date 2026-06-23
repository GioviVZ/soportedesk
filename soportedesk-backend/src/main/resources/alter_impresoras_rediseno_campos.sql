-- =============================================================
-- Migración: rediseño de campos del módulo Impresora — agrega
-- catálogo tipos_impresora y tipo_impresora_id / serie / codigo_inventario /
-- codigo_patrimonial / tipo_conexion a impresoras; elimina modelo_cartucho /
-- modelo_drum / modelo_fusor. La tabla impresoras está vacía en producción
-- (verificado) — no requiere backfill.
-- Ejecutar manualmente en SSMS contra el servidor 172.16.26.16, base ssti.
-- =============================================================

USE ssti;
GO

CREATE TABLE dbo.tipos_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_impresora PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_impresora_nombre UNIQUE (nombre)
);
GO

ALTER TABLE dbo.impresoras ADD
    tipo_impresora_id  BIGINT        NULL,
    serie              NVARCHAR(100) NULL,
    codigo_inventario  NVARCHAR(100) NULL,
    codigo_patrimonial NVARCHAR(100) NULL,
    tipo_conexion       NVARCHAR(10)  NOT NULL CONSTRAINT DF_impresoras_tipo_conexion DEFAULT 'USB';
GO

ALTER TABLE dbo.impresoras
    DROP COLUMN modelo_cartucho, modelo_drum, modelo_fusor;
GO

ALTER TABLE dbo.impresoras ADD
    CONSTRAINT FK_impresoras_tipo_impresora FOREIGN KEY (tipo_impresora_id) REFERENCES dbo.tipos_impresora (id);
GO

-- Verificación
SELECT COUNT(*) AS filas_impresoras FROM dbo.impresoras;
GO
