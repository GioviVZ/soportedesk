IF OBJECT_ID('dbo.IX_vpn_vence', 'I') IS NOT NULL
    DROP INDEX IX_vpn_vence ON dbo.vpn;
GO

IF COL_LENGTH('dbo.vpn', 'ip_asignada') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN ip_asignada;
GO

IF COL_LENGTH('dbo.vpn', 'vence') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN vence;
GO
