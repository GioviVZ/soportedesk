-- ============================================================
-- dbo.impresoras tiene una columna 'nombre' NOT NULL que ya no
-- forma parte del modelo (no esta en schema.sql ni en la entidad
-- Impresora.java desde el rediseno de campos). Una migracion para
-- eliminarla (drop_impresoras_nombre.sql) se escribio el 2026-06-23
-- pero nunca se ejecuto contra esta base antes de borrarse del repo
-- en la limpieza del 2026-06-25 (se asumio, incorrectamente, que ya
-- habia corrido). Ejecutar este script antes de reintentar
-- import_impresoras_inventario.sql.
-- ============================================================

USE ssti;
GO

-- Diagnostico: columnas actuales de dbo.impresoras, para confirmar que
-- 'nombre' es la unica sorpresa antes de reintentar la importacion masiva.
SELECT c.name AS columna, t.name AS tipo, c.is_nullable, c.max_length
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.impresoras')
ORDER BY c.column_id;
GO

IF COL_LENGTH('dbo.impresoras', 'nombre') IS NOT NULL
BEGIN
    ALTER TABLE dbo.impresoras DROP COLUMN nombre;
END;
GO

SELECT
    CASE
        WHEN COL_LENGTH('dbo.impresoras', 'nombre') IS NULL THEN 'OK: columna nombre eliminada'
        ELSE 'PENDIENTE: columna nombre aun existe'
    END AS resultado;
GO

-- tipo_conexion era NVARCHAR(10) — alcanza para 'USB'/'IP'/'Red' pero no
-- para 'Puerto paralelo' (16 caracteres, usado por las EPSON LQ-2090II
-- matriciales del inventario real). Se amplia a NVARCHAR(20).
IF COL_LENGTH('dbo.impresoras', 'tipo_conexion') IS NOT NULL
   AND (SELECT max_length FROM sys.columns WHERE object_id = OBJECT_ID('dbo.impresoras') AND name = 'tipo_conexion') < 40
BEGIN
    ALTER TABLE dbo.impresoras ALTER COLUMN tipo_conexion NVARCHAR(20) NOT NULL;
END;
GO

SELECT max_length AS tipo_conexion_max_length
FROM sys.columns
WHERE object_id = OBJECT_ID('dbo.impresoras') AND name = 'tipo_conexion';
GO
