-- =====================================================================
-- migration_drop_columnas_huerfanas_2026-09-24.sql
--
-- Elimina columnas huerfanas confirmadas (verificadas contra datos reales
-- antes de borrar -- se descartaron otras 4 candidatas iniciales porque
-- tenian datos historicos/reales legitimos: dependencias.activo y
-- subdependencias.activo, dato real importado de GestionTI_INIA;
-- ad_auditoria.host_origen/version_aplicacion, 42 filas de rastro de
-- auditoria historico real de jul-ago 2026. Esas 4 NO se tocan).
--
-- 1. dbo.vpn.titular_tipo_contrato_id: columna + FK agregadas en
--    2026-07-07 (migration 2026-07-07-vpn-titular-externo.sql), nunca
--    mapeadas en Vpn.java ni usadas en ningun lado. 0 filas con dato.
-- 2. dbo.equipo_asignacion.persona_id: huerfana desde que se elimino
--    dbo.persona (2026-09-24). Las 11 filas con valor apuntan a un
--    persona_id que ya no existe en ninguna tabla -- dato inutil, no
--    rastro recuperable.
--
-- DESTRUCTIVO E IRREVERSIBLE (a nivel columna). Backup de las 11 filas
-- con dato antes de borrar. No se ejecuta automaticamente.
-- =====================================================================

BEGIN TRANSACTION;

-- Backup de las filas con dato antes de perder la columna
SELECT equipo_asignacion_id, persona_id INTO dbo.equipo_asignacion_persona_id_backup_20260924
FROM dbo.equipo_asignacion WHERE persona_id IS NOT NULL;

ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_tipo_contrato;
ALTER TABLE dbo.vpn DROP COLUMN titular_tipo_contrato_id;

ALTER TABLE dbo.equipo_asignacion DROP COLUMN persona_id;

COMMIT TRANSACTION;
