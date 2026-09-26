-- =====================================================================
-- migration_drop_columnas_nivel4_2026-09-24.sql
--
-- Elimina columnas write-only confirmadas por auditoria (escritas pero
-- nunca leidas por ningun codigo, backend ni frontend). El codigo Java
-- que las escribia ya fue removido en esta misma fecha (OrdenServicio,
-- OrdenServicioHito, MonitorPing, MonitorPingMuestra,
-- MonitorPingResumenHora + sus servicios/DTOs).
--
-- DESTRUCTIVO E IRREVERSIBLE. Backup de cada tabla afectada antes del
-- drop. No se ejecuta automaticamente.
-- =====================================================================

BEGIN TRANSACTION;

SELECT * INTO dbo.ordenes_servicio_backup_20260924 FROM dbo.ordenes_servicio;
SELECT * INTO dbo.ordenes_servicio_hitos_backup_20260924 FROM dbo.ordenes_servicio_hitos;
SELECT * INTO dbo.monitores_ping_backup_20260924 FROM dbo.monitores_ping;
SELECT * INTO dbo.monitor_ping_muestras_backup_20260924 FROM dbo.monitor_ping_muestras;
SELECT * INTO dbo.monitor_ping_resumen_hora_backup_20260924 FROM dbo.monitor_ping_resumen_hora;

ALTER TABLE dbo.ordenes_servicio DROP COLUMN registrado_por, fecha_registro;
ALTER TABLE dbo.ordenes_servicio_hitos DROP COLUMN fecha_completado;

ALTER TABLE dbo.monitores_ping DROP CONSTRAINT [DF__monitores__fallo__6D9742D9];
ALTER TABLE dbo.monitores_ping DROP COLUMN actualizado_por, fecha_creacion, fecha_actualizacion, fallos_consecutivos;

ALTER TABLE dbo.monitor_ping_muestras DROP COLUMN estado;

ALTER TABLE dbo.monitor_ping_resumen_hora DROP CONSTRAINT [DF__monitor_p__muest__7AF13DF7];
ALTER TABLE dbo.monitor_ping_resumen_hora DROP COLUMN muestras_latencia;

COMMIT TRANSACTION;
