IF OBJECT_ID('dbo.vpn_config_institucional', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.vpn_config_institucional (
        id BIGINT NOT NULL PRIMARY KEY,
        vencimiento_antivirus DATE NOT NULL
    );
END;
GO
