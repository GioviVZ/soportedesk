-- Migracion: titular externo / personal INIA sin cuenta AD para VPN
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas.

IF COL_LENGTH('dbo.vpn', 'titular_tipo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_tipo NVARCHAR(20) NOT NULL CONSTRAINT df_vpn_titular_tipo DEFAULT 'AD';
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_nombre') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_nombre NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_apellidos') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_apellidos NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_correo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_correo NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_sede_id') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_sede_id BIGINT NULL;
    ALTER TABLE dbo.vpn ADD CONSTRAINT fk_vpn_titular_sede FOREIGN KEY (titular_sede_id) REFERENCES dbo.sedes(id);
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_dependencia_id') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_dependencia_id BIGINT NULL;
    ALTER TABLE dbo.vpn ADD CONSTRAINT fk_vpn_titular_dependencia FOREIGN KEY (titular_dependencia_id) REFERENCES dbo.dependencias(id);
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_tipo_contrato_id') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_tipo_contrato_id BIGINT NULL;
    ALTER TABLE dbo.vpn ADD CONSTRAINT fk_vpn_titular_tipo_contrato FOREIGN KEY (titular_tipo_contrato_id) REFERENCES dbo.tipos_contrato(id);
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_empresa') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_empresa NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_motivo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_motivo NVARCHAR(500) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_cargo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_cargo NVARCHAR(30) NOT NULL CONSTRAINT df_vpn_titular_cargo DEFAULT 'Profesional';
END;
GO

-- Verificacion
SELECT titular_tipo, COUNT(*) AS filas FROM dbo.vpn GROUP BY titular_tipo;
GO
