USE ssti;
GO

IF OBJECT_ID(N'dbo.licencia_activaciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.licencia_activaciones (
        id                BIGINT         NOT NULL IDENTITY(1,1),
        licencia_id       BIGINT         NOT NULL,
        cuenta_activacion NVARCHAR(200)  NOT NULL,
        clave_activacion  NVARCHAR(1000) NOT NULL,
        CONSTRAINT PK_licencia_activaciones PRIMARY KEY (id),
        CONSTRAINT FK_licencia_activaciones_licencia FOREIGN KEY (licencia_id)
            REFERENCES dbo.licencias (id) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM dbo.licencia_activaciones a
    INNER JOIN dbo.licencias l ON l.id = a.licencia_id
    WHERE l.cuenta_activacion IS NOT NULL AND l.clave_activacion IS NOT NULL
)
BEGIN
    INSERT INTO dbo.licencia_activaciones (licencia_id, cuenta_activacion, clave_activacion)
    SELECT id, cuenta_activacion, clave_activacion
    FROM dbo.licencias
    WHERE cuenta_activacion IS NOT NULL
      AND LTRIM(RTRIM(cuenta_activacion)) <> N''
      AND clave_activacion IS NOT NULL
      AND LTRIM(RTRIM(clave_activacion)) <> N'';
END;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencia_activaciones_licencia_id')
    CREATE INDEX IX_licencia_activaciones_licencia_id ON dbo.licencia_activaciones (licencia_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencia_activaciones_cuenta')
    CREATE INDEX IX_licencia_activaciones_cuenta ON dbo.licencia_activaciones (cuenta_activacion);
GO
