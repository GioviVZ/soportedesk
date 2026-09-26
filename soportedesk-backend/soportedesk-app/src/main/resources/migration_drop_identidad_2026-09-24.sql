-- =====================================================================
-- migration_drop_identidad_2026-09-24.sql
--
-- Decomisiona la feature "identidad / reconciliacion de personas".
-- DESTRUCTIVO E IRREVERSIBLE. El codigo backend/frontend que la usaba
-- (paquete identidad/, VpnNormalizedSyncService, findPersonaId en
-- EquipoAsignacionSyncService) ya fue eliminado y verificado (compila,
-- arranca, build de frontend OK) antes de correr este script.
--
-- Backup previo (se ejecuta como parte de este mismo script, ver abajo):
--   dbo.persona_backup_20260924 (729 filas al momento de escribir esto)
--   dbo.persona_candidato_backup_20260924 (579 filas, 486 PENDIENTE)
--
-- No se ejecuta automaticamente por la aplicacion
-- (spring.jpa.hibernate.ddl-auto=none, spring.sql.init.mode=never).
-- =====================================================================

BEGIN TRANSACTION;

-- 0. Backup de las tablas antes de borrarlas
SELECT * INTO dbo.persona_backup_20260924 FROM dbo.persona;
SELECT * INTO dbo.persona_candidato_backup_20260924 FROM dbo.persona_candidato;

-- 1. Drop foreign keys que referencian dbo.persona
ALTER TABLE dbo.equipo_asignacion DROP CONSTRAINT FK_equipo_asignacion_persona;
ALTER TABLE dbo.vpn_solicitud DROP CONSTRAINT FK_vpn_solicitud_persona;
ALTER TABLE dbo.persona_candidato DROP CONSTRAINT FK_persona_candidato_persona;

-- 2. Drop tabla hija primero (persona_candidato referencia a persona)
DROP TABLE dbo.persona_candidato;

-- 3. Drop tabla padre
DROP TABLE dbo.persona;

-- 4. Drop la secuencia usada solo por PersonaReconciliacionService.confirmar()
DROP SEQUENCE dbo.seq_persona_id;

COMMIT TRANSACTION;

-- Nota: dbo.equipo_asignacion.persona_id y dbo.vpn_solicitud.persona_id NO
-- se tocan aqui: quedan como columnas nullable huerfanas (siempre NULL de
-- aca en adelante, ya que EquipoAsignacionSyncService.findPersonaId() y
-- VpnNormalizedSyncService fueron eliminados). Dropear esas columnas, o las
-- tablas vpn_solicitud/vpn_solicitud_snapshot, queda como decision futura
-- separada.
