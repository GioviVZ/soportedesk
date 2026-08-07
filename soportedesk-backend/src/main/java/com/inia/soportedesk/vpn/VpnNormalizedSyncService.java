package com.inia.soportedesk.vpn;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Mantiene la tabla normalizada en paralelo mientras dbo.vpn siga siendo la
 * fuente de lectura. Si el titular todavía no fue reconciliado con persona, la
 * operación histórica continúa normalmente y el backfill incremental podrá
 * incorporarla después.
 */
@Service
@RequiredArgsConstructor
public class VpnNormalizedSyncService {

    private final JdbcTemplate jdbc;

    public boolean sync(Vpn vpn) {
        Long personaId = findPersonaId(vpn);
        if (personaId == null) {
            return false;
        }

        Long equipoAsignacionId = queryOptionalLong(
                "SELECT equipo_asignacion_id FROM dbo.equipo_asignacion "
                        + "WHERE glpi_computer_id = ?",
                vpn.getGlpiComputerId());
        Long estadoId = findEstadoId(vpn.getEstadoSolicitud());
        Long solicitadoPorId = requiredUserId(vpn.getSolicitadoPor());
        Long aprobadoPorId = queryOptionalLong(
                "SELECT id FROM dbo.usuarios WHERE username = ?",
                vpn.getAprobadoPor());

        int updated = jdbc.update("""
                UPDATE dbo.vpn_solicitud SET
                    persona_id = ?, equipo_asignacion_id = ?, estado_solicitud_id = ?,
                    numero_ticket = ?, vence = ?, usuario_vpn = ?, credencial_vpn = ?,
                    tiene_antivirus = ?, antivirus_verificado = ?,
                    analisis_antivirus_realizado = ?, vencimiento_antivirus = ?,
                    sistema_operativo_actualizado = ?, forticlient_instalado = ?,
                    host_actualizado = ?, comentario_responsable = ?,
                    solicitado_por = ?, fecha_solicitud = ?, aprobado_por = ?,
                    fecha_resolucion = ?
                WHERE vpn_solicitud_id = ?
                """,
                personaId, equipoAsignacionId, estadoId, vpn.getNumeroTicket(),
                vpn.getVence(), vpn.getUsuarioVpn(), vpn.getCredencialVpn(),
                vpn.getTieneAntivirus(), vpn.getAntivirusVerificado(),
                vpn.getAnalisisAntivirusRealizado(), vpn.getVencimientoAntivirus(),
                vpn.getSistemaOperativoActualizado(), vpn.getForticlientInstalado(),
                vpn.getHostActualizado(), vpn.getComentarioResponsable(),
                solicitadoPorId, vpn.getFechaSolicitud(), aprobadoPorId,
                vpn.getFechaResolucion(), vpn.getId());

        if (updated == 0) {
            jdbc.update("""
                    INSERT INTO dbo.vpn_solicitud
                        (vpn_solicitud_id, persona_id, equipo_asignacion_id,
                         estado_solicitud_id, numero_ticket, ip_asignada, vence,
                         usuario_vpn, credencial_vpn, tiene_antivirus,
                         antivirus_verificado, analisis_antivirus_realizado,
                         vencimiento_antivirus, sistema_operativo_actualizado,
                         forticlient_instalado, host_actualizado,
                         comentario_responsable, solicitado_por, fecha_solicitud,
                         aprobado_por, fecha_resolucion)
                    VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?)
                    """,
                    vpn.getId(), personaId, equipoAsignacionId, estadoId,
                    vpn.getNumeroTicket(), vpn.getVence(), vpn.getUsuarioVpn(),
                    vpn.getCredencialVpn(), vpn.getTieneAntivirus(),
                    vpn.getAntivirusVerificado(), vpn.getAnalisisAntivirusRealizado(),
                    vpn.getVencimientoAntivirus(), vpn.getSistemaOperativoActualizado(),
                    vpn.getForticlientInstalado(), vpn.getHostActualizado(),
                    vpn.getComentarioResponsable(), solicitadoPorId,
                    vpn.getFechaSolicitud(), aprobadoPorId, vpn.getFechaResolucion());
        }
        upsertSnapshot(vpn);
        return true;
    }

    public void deleteMirror(Long vpnId) {
        jdbc.update("DELETE FROM dbo.vpn_solicitud_snapshot WHERE vpn_solicitud_id = ?", vpnId);
        jdbc.update("DELETE FROM dbo.vpn_solicitud WHERE vpn_solicitud_id = ?", vpnId);
    }

    private void upsertSnapshot(Vpn vpn) {
        int updated = jdbc.update("""
                UPDATE dbo.vpn_solicitud_snapshot SET
                    titular_nombre_completo = ?, titular_correo = ?,
                    titular_cargo = ?, titular_empresa = ?, titular_sede = ?,
                    titular_dependencia = ?, ad_display_name = ?, ad_mail = ?,
                    ad_office = ?, ad_organizational_unit = ?, fecha_captura = ?
                WHERE vpn_solicitud_id = ?
                """,
                vpn.getTitularNombreCompleto(), titularCorreo(vpn),
                vpn.getTitularCargo(), vpn.getTitularEmpresa(), vpn.getAdOffice(),
                vpn.getAdOffice(), vpn.getAdDisplayName(), vpn.getAdMail(),
                vpn.getAdOffice(), vpn.getAdOrganizationalUnit(),
                LocalDateTime.now(), vpn.getId());
        if (updated == 0) {
            jdbc.update("""
                    INSERT INTO dbo.vpn_solicitud_snapshot
                        (vpn_solicitud_id, titular_nombre_completo, titular_correo,
                         titular_cargo, titular_empresa, titular_sede,
                         titular_dependencia, ad_display_name, ad_mail, ad_office,
                         ad_organizational_unit, fecha_captura)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    vpn.getId(), vpn.getTitularNombreCompleto(), titularCorreo(vpn),
                    vpn.getTitularCargo(), vpn.getTitularEmpresa(), vpn.getAdOffice(),
                    vpn.getAdOffice(), vpn.getAdDisplayName(), vpn.getAdMail(),
                    vpn.getAdOffice(), vpn.getAdOrganizationalUnit(),
                    LocalDateTime.now());
        }
    }

    private Long findPersonaId(Vpn vpn) {
        String sam = blankToNull(vpn.getAdSamAccountName());
        if (sam != null) {
            Long id = queryOptionalLong(
                    "SELECT TOP 1 persona_id FROM dbo.persona "
                            + "WHERE LOWER(sam_account_name) = LOWER(?)",
                    sam);
            if (id != null) {
                return id;
            }
        }
        if (!"AD".equals(vpn.getTitularTipo())) {
            return null;
        }
        String email = vpn.getAdMail();
        return queryOptionalLong(
                "SELECT TOP 1 persona_id FROM dbo.persona "
                        + "WHERE LOWER(correo_institucional) = LOWER(?)",
                blankToNull(email));
    }

    private Long findEstadoId(String estado) {
        String codigo = switch (estado == null ? "" : estado) {
            case "APROBADO" -> "APROBADA";
            case "RECHAZADO" -> "RECHAZADA";
            case "OBSERVADO" -> "EN_REVISION";
            default -> "PENDIENTE";
        };
        Long id = queryOptionalLong(
                "SELECT EstadoSolicitudID FROM vpn.EstadosSolicitud WHERE Codigo = ?",
                codigo);
        if (id == null) {
            throw new IllegalStateException("Estado VPN normalizado no configurado: " + codigo);
        }
        return id;
    }

    private Long requiredUserId(String username) {
        Long id = queryOptionalLong(
                "SELECT id FROM dbo.usuarios WHERE username = ?",
                blankToNull(username));
        if (id == null) {
            throw new IllegalStateException("Usuario del sistema no encontrado: " + username);
        }
        return id;
    }

    private Long queryOptionalLong(String sql, Object argument) {
        if (argument == null) {
            return null;
        }
        try {
            return jdbc.queryForObject(sql, Long.class, argument);
        } catch (EmptyResultDataAccessException ignored) {
            return null;
        }
    }

    private String titularCorreo(Vpn vpn) {
        return blankToNull(vpn.getAdMail()) != null ? vpn.getAdMail() : vpn.getTitularCorreo();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
