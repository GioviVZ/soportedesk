-- Migracion: checklist de verificacion VPN - SO actualizado, Forticlient instalado
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas.

IF COL_LENGTH('dbo.vpn', 'sistema_operativo_actualizado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD sistema_operativo_actualizado BIT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'forticlient_instalado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD forticlient_instalado BIT NULL;
END;
GO

-- Verificacion
SELECT COL_LENGTH('dbo.vpn', 'sistema_operativo_actualizado') AS sistema_operativo_actualizado_ok,
       COL_LENGTH('dbo.vpn', 'forticlient_instalado') AS forticlient_instalado_ok;
GO
