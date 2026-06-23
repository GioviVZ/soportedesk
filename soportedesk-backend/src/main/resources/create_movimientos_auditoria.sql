-- =============================================================
-- Migracion: crea la tabla de auditoria de movimientos.
-- Ejecutar manualmente en SSMS contra la base ssti.
-- =============================================================

USE ssti;
GO

IF OBJECT_ID(N'dbo.movimientos_auditoria', N'U') IS NULL
BEGIN
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
END;
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

SELECT 'OK: tabla movimientos_auditoria disponible' AS resultado;
GO
