SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF EXISTS (
    SELECT 1 FROM dbo.impresoras
    WHERE NULLIF(LTRIM(RTRIM(serie)), '') IS NOT NULL
    GROUP BY LOWER(LTRIM(RTRIM(serie))) HAVING COUNT(*) > 1
)
    THROW 51000, 'Existen series de impresora duplicadas.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.impresoras
    WHERE NULLIF(LTRIM(RTRIM(codigo_inventario)), '') IS NOT NULL
    GROUP BY LOWER(LTRIM(RTRIM(codigo_inventario))) HAVING COUNT(*) > 1
)
    THROW 51001, 'Existen códigos de inventario de impresora duplicados.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.impresoras
    WHERE NULLIF(LTRIM(RTRIM(codigo_patrimonial)), '') IS NOT NULL
    GROUP BY LOWER(LTRIM(RTRIM(codigo_patrimonial))) HAVING COUNT(*) > 1
)
    THROW 51002, 'Existen códigos patrimoniales de impresora duplicados.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.impresoras
    WHERE NULLIF(LTRIM(RTRIM(ip)), '') IS NOT NULL
    GROUP BY LOWER(LTRIM(RTRIM(ip))) HAVING COUNT(*) > 1
)
    THROW 51003, 'Existen direcciones IP de impresora duplicadas.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UIX_impresoras_serie' AND object_id = OBJECT_ID(N'dbo.impresoras'))
    CREATE UNIQUE INDEX UIX_impresoras_serie ON dbo.impresoras (serie) WHERE serie IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UIX_impresoras_codigo_inventario' AND object_id = OBJECT_ID(N'dbo.impresoras'))
    CREATE UNIQUE INDEX UIX_impresoras_codigo_inventario ON dbo.impresoras (codigo_inventario) WHERE codigo_inventario IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UIX_impresoras_codigo_patrimonial' AND object_id = OBJECT_ID(N'dbo.impresoras'))
    CREATE UNIQUE INDEX UIX_impresoras_codigo_patrimonial ON dbo.impresoras (codigo_patrimonial) WHERE codigo_patrimonial IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UIX_impresoras_ip' AND object_id = OBJECT_ID(N'dbo.impresoras'))
    CREATE UNIQUE INDEX UIX_impresoras_ip ON dbo.impresoras (ip) WHERE ip IS NOT NULL;

COMMIT TRANSACTION;
