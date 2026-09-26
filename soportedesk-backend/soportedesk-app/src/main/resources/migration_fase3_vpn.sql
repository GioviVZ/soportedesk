-- =====================================================================
-- Fase 3 del Plan de Normalizacion (seccion 4.4) -- VPN.
-- Requiere que la Fase Identidad ya haya corrido (dbo.persona) y que
-- equipo_asignacion exista (Fase 2). Incluye el campo numero_ticket
-- agregado a pedido del equipo (24-jul-2026).
--
-- MIGRACION PARCIAL A PROPOSITO: de las 423 solicitudes en dbo.vpn hoy,
-- solo 30 resuelven un persona_id valido contra las 100 personas del
-- piloto (dbo.persona). persona_id es NOT NULL por diseno -- no tiene
-- sentido forzar las otras 393. Se migran las 30 resolubles; dbo.vpn
-- SIGUE ACTIVA e intacta para el resto y para las solicitudes nuevas,
-- hasta que el trabajo de reconciliacion (reconciliacion_ad_sin_persona.csv
-- / reconciliacion_gw_sin_persona.csv) reduzca la brecha. Esto es
-- exactamente la mitigacion que el propio plan describe: "tablas viejas
-- en paralelo, no se eliminan hasta validar".
--
-- Verificado antes de escribir esto (solo lectura):
--   - solicitado_por / aprobado_por calzan 100% (423/423) contra
--     usuarios.username -- join directo, sin ambiguedad.
--   - vpn.estado_solicitud tiene un unico valor hoy, 'APROBADO' (423/423),
--     que NO calza textualmente con vpn.EstadosSolicitud.Codigo =
--     'APROBADA' (con A) -- se mapea explicito abajo, no por texto igual.
--
-- numero_ticket queda NULL para las filas migradas (dato historico que
-- no existia) -- se exige NOT NULL solo a nivel de aplicacion para
-- solicitudes nuevas, no a nivel de columna, para no bloquear la
-- migracion de datos reales.
--
-- PRERREQUISITO: backup completo verificado; Fase Identidad y Fase 2
-- ya aplicadas.
-- =====================================================================

USE ssti;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION Fase3Vpn;

    CREATE TABLE dbo.vpn_solicitud (
        vpn_solicitud_id  BIGINT NOT NULL PRIMARY KEY,
        persona_id         BIGINT NOT NULL,
        equipo_asignacion_id BIGINT NULL,
        estado_solicitud_id   INT NOT NULL,
        numero_ticket          NVARCHAR(50) NULL,  -- ver nota arriba: NOT NULL solo en la app, para solicitudes nuevas
        ip_asignada             NVARCHAR(45) NULL,
        vence                    DATE NULL,
        usuario_vpn               NVARCHAR(100) NULL,
        credencial_vpn             NVARCHAR(200) NULL,
        tiene_antivirus              BIT NULL,
        antivirus_verificado          BIT NULL,
        analisis_antivirus_realizado   BIT NULL,
        vencimiento_antivirus            DATE NULL,
        sistema_operativo_actualizado     BIT NULL,
        forticlient_instalado              BIT NULL,
        host_actualizado                    BIT NULL,
        comentario_responsable                NVARCHAR(500) NULL,
        solicitado_por                          BIGINT NOT NULL,
        fecha_solicitud                           DATETIME NOT NULL,
        aprobado_por                                BIGINT NULL,
        fecha_resolucion                              DATETIME NULL,
        CONSTRAINT FK_vpn_solicitud_persona FOREIGN KEY (persona_id) REFERENCES dbo.persona(persona_id),
        CONSTRAINT FK_vpn_solicitud_equipo FOREIGN KEY (equipo_asignacion_id) REFERENCES dbo.equipo_asignacion(equipo_asignacion_id),
        CONSTRAINT FK_vpn_solicitud_estado FOREIGN KEY (estado_solicitud_id) REFERENCES vpn.EstadosSolicitud(EstadoSolicitudID),
        CONSTRAINT FK_vpn_solicitud_solicitante FOREIGN KEY (solicitado_por) REFERENCES dbo.usuarios(id),
        CONSTRAINT FK_vpn_solicitud_aprobador FOREIGN KEY (aprobado_por) REFERENCES dbo.usuarios(id)
    );

    CREATE TABLE dbo.vpn_solicitud_snapshot (
        vpn_solicitud_snapshot_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        vpn_solicitud_id           BIGINT NOT NULL,
        titular_nombre_completo      NVARCHAR(300) NOT NULL,
        titular_correo                 NVARCHAR(150) NULL,
        titular_cargo                    NVARCHAR(30) NULL,
        titular_empresa                    NVARCHAR(150) NULL,
        titular_sede                         NVARCHAR(150) NULL,
        titular_dependencia                    NVARCHAR(150) NULL,
        ad_display_name                          NVARCHAR(255) NULL,
        ad_mail                                    NVARCHAR(255) NULL,
        ad_office                                    NVARCHAR(255) NULL,
        ad_organizational_unit                         NVARCHAR(500) NULL,
        fecha_captura                                    DATETIME2 NOT NULL,
        CONSTRAINT UQ_vpn_solicitud_snapshot_solicitud UNIQUE (vpn_solicitud_id),
        CONSTRAINT FK_vpn_solicitud_snapshot_solicitud FOREIGN KEY (vpn_solicitud_id) REFERENCES dbo.vpn_solicitud(vpn_solicitud_id)
    );

    INSERT INTO dbo.vpn_solicitud
        (vpn_solicitud_id, persona_id, equipo_asignacion_id, estado_solicitud_id, numero_ticket,
         ip_asignada, vence, usuario_vpn, credencial_vpn, tiene_antivirus, antivirus_verificado,
         analisis_antivirus_realizado, vencimiento_antivirus, sistema_operativo_actualizado,
         forticlient_instalado, host_actualizado, comentario_responsable, solicitado_por,
         fecha_solicitud, aprobado_por, fecha_resolucion)
    SELECT
        v.id, p.persona_id, ea.equipo_asignacion_id,
        CASE v.estado_solicitud WHEN 'APROBADO' THEN 3 ELSE NULL END,  -- ver mapeo verificado arriba
        NULL,
        v.ip_asignada, v.vence, v.usuario_vpn, v.credencial_vpn, v.tiene_antivirus,
        v.antivirus_verificado, v.analisis_antivirus_realizado, v.vencimiento_antivirus,
        v.sistema_operativo_actualizado, v.forticlient_instalado, v.host_actualizado,
        v.comentario_responsable, u1.id, v.fecha_solicitud, u2.id, v.fecha_resolucion
    FROM dbo.vpn v
    JOIN dbo.persona p
      ON (v.ad_sam_account_name IS NOT NULL AND p.sam_account_name = v.ad_sam_account_name)
      OR (v.titular_correo IS NOT NULL AND p.correo_institucional = v.titular_correo)
    LEFT JOIN dbo.equipo_asignacion ea ON ea.glpi_computer_id = v.glpi_computer_id
    LEFT JOIN dbo.usuarios u1 ON u1.username = v.solicitado_por
    LEFT JOIN dbo.usuarios u2 ON u2.username = v.aprobado_por;

    INSERT INTO dbo.vpn_solicitud_snapshot
        (vpn_solicitud_id, titular_nombre_completo, titular_correo, titular_cargo, titular_empresa,
         titular_sede, titular_dependencia, ad_display_name, ad_mail, ad_office,
         ad_organizational_unit, fecha_captura)
    SELECT
        v.id,
        LTRIM(RTRIM(ISNULL(v.titular_nombre,'') + ' ' + ISNULL(v.titular_apellidos,''))),
        v.titular_correo, v.titular_cargo, v.titular_empresa,
        s.nombre, d.nombre,
        v.ad_display_name, v.ad_mail, v.ad_office, v.ad_organizational_unit,
        v.fecha_solicitud
    FROM dbo.vpn v
    JOIN dbo.vpn_solicitud vs ON vs.vpn_solicitud_id = v.id  -- solo las que sí migraron arriba
    LEFT JOIN dbo.sedes s ON s.id = v.titular_sede_id
    LEFT JOIN dbo.dependencias d ON d.id = v.titular_dependencia_id;

COMMIT TRANSACTION Fase3Vpn;
GO

SELECT 'vpn_solicitud migradas' AS chequeo, COUNT(*) AS filas FROM dbo.vpn_solicitud
UNION ALL
SELECT 'vpn (historica, sigue activa)', COUNT(*) FROM dbo.vpn
UNION ALL
SELECT 'pendientes de reconciliar', (SELECT COUNT(*) FROM dbo.vpn) - (SELECT COUNT(*) FROM dbo.vpn_solicitud);
GO
