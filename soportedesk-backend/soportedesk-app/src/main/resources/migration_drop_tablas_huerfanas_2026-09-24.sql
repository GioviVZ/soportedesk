-- =====================================================================
-- migration_drop_tablas_huerfanas_2026-09-24.sql
--
-- Elimina tablas confirmadas como huerfanas (cero codigo Java, cero UI)
-- tras una auditoria completa del backend/frontend:
--   - dbo.vpn_solicitud / vpn_solicitud_snapshot / vpn.EstadosSolicitud:
--     espejo normalizado de VPN, unico escritor (VpnNormalizedSyncService)
--     eliminado el 2026-09-24 junto con la feature de identidad.
--   - dbo.anexo: tiene datos importados pero nunca tuvo entidad JPA/UI.
--   - dbo.inventario_equipos/discos/programas/redes/red_ips: subsistema
--     completo de "agente de inventario remoto", sin controller/entidad
--     en el codigo actual (piloto abandonado).
--   - core.TiposCuentaDirectorio: solo la usaban dbo.persona.tipo_cuenta_id
--     y PersonaReconciliacionService.confirmar(), ambos eliminados hoy.
--   - dbo.persona_backup_20260924 / persona_candidato_backup_20260924:
--     backups temporales creados en la migracion de identidad de hoy,
--     ya no necesarios.
--
-- DESTRUCTIVO E IRREVERSIBLE. Se toma backup de cada tabla con datos
-- antes de borrarla (ver bloque 0). No se ejecuta automaticamente
-- (spring.jpa.hibernate.ddl-auto=none, spring.sql.init.mode=never).
-- =====================================================================

BEGIN TRANSACTION;

-- 0. Backups
SELECT * INTO dbo.anexo_backup_20260924 FROM dbo.anexo;
SELECT * INTO dbo.inventario_equipos_backup_20260924 FROM dbo.inventario_equipos;
SELECT * INTO dbo.inventario_discos_backup_20260924 FROM dbo.inventario_discos;
SELECT * INTO dbo.inventario_programas_backup_20260924 FROM dbo.inventario_programas;
SELECT * INTO dbo.inventario_redes_backup_20260924 FROM dbo.inventario_redes;
SELECT * INTO dbo.inventario_red_ips_backup_20260924 FROM dbo.inventario_red_ips;
SELECT * INTO dbo.vpn_solicitud_backup_20260924 FROM dbo.vpn_solicitud;
SELECT * INTO dbo.vpn_solicitud_snapshot_backup_20260924 FROM dbo.vpn_solicitud_snapshot;
SELECT * INTO dbo.vpn_estados_solicitud_backup_20260924 FROM vpn.EstadosSolicitud;
SELECT * INTO dbo.core_tiposcuentadirectorio_backup_20260924 FROM core.TiposCuentaDirectorio;

-- 1. Drop en orden (hijos antes que padres)
DROP TABLE dbo.inventario_red_ips;
DROP TABLE dbo.inventario_discos;
DROP TABLE dbo.inventario_programas;
DROP TABLE dbo.inventario_redes;
DROP TABLE dbo.inventario_equipos;

DROP TABLE dbo.vpn_solicitud_snapshot;
DROP TABLE dbo.vpn_solicitud;
DROP TABLE vpn.EstadosSolicitud;

DROP TABLE dbo.anexo;
DROP TABLE core.TiposCuentaDirectorio;

-- 2. Backups de la limpieza de identidad de hoy, ya no necesarios
DROP TABLE dbo.persona_backup_20260924;
DROP TABLE dbo.persona_candidato_backup_20260924;

COMMIT TRANSACTION;
