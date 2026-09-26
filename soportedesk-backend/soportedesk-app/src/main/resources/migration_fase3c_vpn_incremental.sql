-- =====================================================================
-- Migracion INCREMENTAL de vpn_solicitud -- corre despues de que la
-- reconciliacion automatica subio la cobertura de persona (100 -> 651,
-- luego 640 tras limpiar 11 falsos positivos). Solo inserta las
-- solicitudes VPN que AHORA resuelven persona_id y que TODAVIA no estan
-- en vpn_solicitud (para no duplicar las 30 ya migradas en
-- migration_fase3_vpn.sql).
--
-- CORREGIDO (24-jul-2026, v2): la v1 matcheaba tambien por
-- v.titular_correo = p.correo_institucional. Eso fallo con violacion de
-- PK en vpn.id=686 porque es un titular EXTERNO ("Carmen Ines Perez
-- Risco", NO empleado de INIA) cuyo titular_correo coincidio por pura
-- coincidencia con un buzon departamental compartido
-- (abastecimiento1@inia.gob.pe) que tambien usan 2 empleados internos.
-- Un titular EXTERNO nunca deberia resolver contra una persona interna
-- -- se elimina esa rama del join por completo, queda solo
-- ad_sam_account_name (UNIQUE en persona, sin riesgo de match multiple,
-- verificado antes de escribir esto: 66 filas nuevas, 0 con mas de 1
-- match).
--
-- PRERREQUISITO: migration_reconciliacion_limpiar_falsos_positivos.sql
-- ya aplicado.
-- =====================================================================

USE ssti;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION Fase3Incremental;

    INSERT INTO dbo.vpn_solicitud
        (vpn_solicitud_id, persona_id, equipo_asignacion_id, estado_solicitud_id, numero_ticket,
         ip_asignada, vence, usuario_vpn, credencial_vpn, tiene_antivirus, antivirus_verificado,
         analisis_antivirus_realizado, vencimiento_antivirus, sistema_operativo_actualizado,
         forticlient_instalado, host_actualizado, comentario_responsable, solicitado_por,
         fecha_solicitud, aprobado_por, fecha_resolucion)
    SELECT
        v.id, p.persona_id, ea.equipo_asignacion_id,
        CASE v.estado_solicitud
            WHEN 'APROBADO' THEN 3
            WHEN 'RECHAZADO' THEN 4
            WHEN 'OBSERVADO' THEN 2
            ELSE 1
        END,
        v.numero_ticket,
        v.ip_asignada, v.vence, v.usuario_vpn, v.credencial_vpn, v.tiene_antivirus,
        v.antivirus_verificado, v.analisis_antivirus_realizado, v.vencimiento_antivirus,
        v.sistema_operativo_actualizado, v.forticlient_instalado, v.host_actualizado,
        v.comentario_responsable, u1.id, v.fecha_solicitud, u2.id, v.fecha_resolucion
    FROM dbo.vpn v
    JOIN dbo.persona p ON p.sam_account_name = v.ad_sam_account_name
    LEFT JOIN dbo.equipo_asignacion ea ON ea.glpi_computer_id = v.glpi_computer_id
    LEFT JOIN dbo.usuarios u1 ON u1.username = v.solicitado_por
    LEFT JOIN dbo.usuarios u2 ON u2.username = v.aprobado_por
    WHERE NOT EXISTS (SELECT 1 FROM dbo.vpn_solicitud vs WHERE vs.vpn_solicitud_id = v.id);

    INSERT INTO dbo.vpn_solicitud_snapshot
        (vpn_solicitud_id, titular_nombre_completo, titular_correo, titular_cargo, titular_empresa,
         titular_sede, titular_dependencia, ad_display_name, ad_mail, ad_office,
         ad_organizational_unit, fecha_captura)
    SELECT
        v.id,
        COALESCE(NULLIF(v.ad_display_name, ''),
                 NULLIF(LTRIM(RTRIM(ISNULL(v.titular_nombre,'') + ' ' + ISNULL(v.titular_apellidos,''))), ''),
                 v.ad_sam_account_name),
        COALESCE(v.ad_mail, v.titular_correo), v.titular_cargo, v.titular_empresa,
        s.nombre, d.nombre,
        v.ad_display_name, v.ad_mail, v.ad_office, v.ad_organizational_unit,
        v.fecha_solicitud
    FROM dbo.vpn v
    JOIN dbo.vpn_solicitud vs ON vs.vpn_solicitud_id = v.id
    LEFT JOIN dbo.sedes s ON s.id = v.titular_sede_id
    LEFT JOIN dbo.dependencias d ON d.id = v.titular_dependencia_id
    WHERE NOT EXISTS (SELECT 1 FROM dbo.vpn_solicitud_snapshot sn WHERE sn.vpn_solicitud_id = v.id);

COMMIT TRANSACTION Fase3Incremental;
GO

SELECT 'vpn_solicitud total' AS chequeo, COUNT(*) AS filas FROM dbo.vpn_solicitud
UNION ALL
SELECT 'vpn_solicitud_snapshot total', COUNT(*) FROM dbo.vpn_solicitud_snapshot
UNION ALL
SELECT 'vpn (historica, sigue activa)', COUNT(*) FROM dbo.vpn;
GO
