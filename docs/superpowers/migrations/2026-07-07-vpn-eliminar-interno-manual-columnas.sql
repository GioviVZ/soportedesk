-- Elimina las columnas titular_sede_id/titular_dependencia_id/titular_tipo_contrato_id de dbo.vpn.
-- Ejecutar en: ssti (SQL Server), DESPUES de vaciar los registros INTERNO_MANUAL (ver script de
-- datos) -- esas columnas contienen los valores de esos registros.

IF OBJECT_ID('dbo.fk_vpn_titular_sede', 'F') IS NOT NULL
    ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_sede;
GO
IF OBJECT_ID('dbo.fk_vpn_titular_dependencia', 'F') IS NOT NULL
    ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_dependencia;
GO
IF OBJECT_ID('dbo.fk_vpn_titular_tipo_contrato', 'F') IS NOT NULL
    ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_tipo_contrato;
GO

IF COL_LENGTH('dbo.vpn', 'titular_sede_id') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN titular_sede_id;
GO
IF COL_LENGTH('dbo.vpn', 'titular_dependencia_id') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN titular_dependencia_id;
GO
IF COL_LENGTH('dbo.vpn', 'titular_tipo_contrato_id') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN titular_tipo_contrato_id;
GO
