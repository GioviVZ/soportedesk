IF COL_LENGTH('dbo.vpn', 'titular_subdependencia_id') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_subdependencia_id BIGINT NULL;
    ALTER TABLE dbo.vpn ADD CONSTRAINT fk_vpn_titular_subdependencia
        FOREIGN KEY (titular_subdependencia_id) REFERENCES dbo.subdependencias(id);
END;
GO
