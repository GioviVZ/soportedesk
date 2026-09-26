-- =====================================================================
-- Limpieza final del schema core (piloto de identidad, ya reemplazado
-- por dbo.persona) y del schema org (tablas puente de la Fase 1, ya
-- cumplieron su funcion).
--
-- IMPORTANTE: core.TiposCuentaDirectorio NO se incluye -- dbo.persona
-- (activa, en uso por VpnNormalizedSyncService/EquipoAsignacionSyncService)
-- tiene una FK real hacia ella (persona.tipo_cuenta_id). Se queda como
-- catalogo de referencia aunque el codigo no la consulte directo.
--
-- Orden de DROP respeta las FK: primero las hojas (PersonaAsignaciones,
-- PersonaContratos), despues Personas (que dependia de esas dos).
--
-- Verificado antes de este script: 0 referencias en el codigo de la
-- aplicacion para las 8 tablas listadas; sin dependientes cruzados
-- excepto los ya contemplados en el orden de abajo.
-- =====================================================================

USE ssti;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION LimpiezaCoreOrg;

    DROP TABLE core.PersonaAsignaciones;
    DROP TABLE core.PersonaContratos;
    DROP TABLE core.Personas;
    DROP TABLE core.ClasificacionCuentasAD;
    DROP TABLE core.OrganizacionADMapeo;

    DROP TABLE org.SedeMapeo;
    DROP TABLE org.DependenciaMapeo;
    DROP TABLE org.SubdependenciaMapeo;
    DROP TABLE org.AnexoMapeo;

COMMIT TRANSACTION LimpiezaCoreOrg;
GO

SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA IN ('core', 'org');
GO
-- Deberia devolver solo: core.TiposCuentaDirectorio
