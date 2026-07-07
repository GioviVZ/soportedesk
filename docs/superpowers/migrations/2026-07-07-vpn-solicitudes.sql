-- Migracion: flujo de solicitud/aprobacion para VPN
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas.

IF COL_LENGTH('dbo.vpn', 'estado_solicitud') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD estado_solicitud NVARCHAR(20) NOT NULL CONSTRAINT df_vpn_estado_solicitud DEFAULT 'PENDIENTE';
END;
GO

IF COL_LENGTH('dbo.vpn', 'tipo_equipo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD tipo_equipo NVARCHAR(20) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'glpi_computer_id') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD glpi_computer_id BIGINT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'glpi_nombre_equipo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD glpi_nombre_equipo NVARCHAR(255) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'glpi_ip_equipo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD glpi_ip_equipo NVARCHAR(50) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'antivirus_verificado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD antivirus_verificado BIT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'analisis_antivirus_realizado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD analisis_antivirus_realizado BIT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'host_actualizado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD host_actualizado BIT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'comentario_responsable') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD comentario_responsable NVARCHAR(500) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'solicitado_por') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD solicitado_por NVARCHAR(80) NOT NULL CONSTRAINT df_vpn_solicitado_por DEFAULT 'sistema';
END;
GO

IF COL_LENGTH('dbo.vpn', 'solicitado_por_nombre') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD solicitado_por_nombre NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'fecha_solicitud') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD fecha_solicitud DATETIME NOT NULL CONSTRAINT df_vpn_fecha_solicitud DEFAULT GETDATE();
END;
GO

IF COL_LENGTH('dbo.vpn', 'aprobado_por') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD aprobado_por NVARCHAR(80) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'aprobado_por_nombre') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD aprobado_por_nombre NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'fecha_resolucion') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD fecha_resolucion DATETIME NULL;
END;
GO

-- Los registros VPN existentes ya tienen usuario/contrasena asignados: se consideran
-- aprobados retroactivamente para que no aparezcan como solicitudes pendientes.
UPDATE dbo.vpn
SET estado_solicitud = 'APROBADO'
WHERE usuario_vpn IS NOT NULL AND usuario_vpn <> '';
GO

-- Verificacion
SELECT estado_solicitud, COUNT(*) AS filas FROM dbo.vpn GROUP BY estado_solicitud;
GO
