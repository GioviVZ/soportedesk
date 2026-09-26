-- =====================================================================
-- Agrega numero_ticket a la tabla vpn ACTIVA (no vpn_solicitud) --
-- porque el backend hoy sigue leyendo/escribiendo dbo.vpn (423 filas
-- reales); vpn_solicitud solo tiene 30 migradas y no es todavia la tabla
-- operativa. El campo se exige NOT NULL a nivel de aplicacion
-- (VpnRequest.java, @NotBlank) para solicitudes nuevas, pero se agrega
-- NULL a nivel de columna para no romper las 423 filas historicas.
-- =====================================================================

USE ssti;
GO
ALTER TABLE dbo.vpn ADD numero_ticket NVARCHAR(50) NULL;
GO
