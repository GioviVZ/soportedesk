package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Proyecta los datos operativos de equipos_enrichment en la tabla
 * normalizada. GLPI continúa siendo la fuente técnica del inventario.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EquipoAsignacionSyncService {

    private final JdbcTemplate jdbc;
    private final VwInvComputerFullRepository glpiRepository;

    /**
     * Job programado: da de alta en equipo_asignacion los equipos GLPI
     * activos que todavia no tienen fila (nunca modifica los que ya
     * existen -- eso lo hace sync(EquipoEnrichment) cuando alguien
     * revisa un equipo puntual). Corre solo, sin intervencion manual;
     * antes de esto se corria a mano y ya se habia desactualizado
     * (999 vs 1,008 equipos reales, detectado el 31-jul-2026).
     */
    @Scheduled(cron = "${equipos.sync-glpi-cron:0 0 3 * * *}")
    public void sincronizarCatalogoCompleto() {
        List<Long> activosEnGlpi = glpiRepository.findActiveComputerIds();
        Set<Long> yaRegistrados = new HashSet<>(jdbc.query(
                "SELECT glpi_computer_id FROM dbo.equipo_asignacion",
                (rs, rowNum) -> rs.getLong(1)));

        List<Long> faltantes = activosEnGlpi.stream()
                .filter(id -> !yaRegistrados.contains(id))
                .toList();

        if (faltantes.isEmpty()) {
            log.info("equipo_asignacion ya esta al dia con GLPI ({} equipos activos)", activosEnGlpi.size());
            return;
        }

        for (Long glpiComputerId : faltantes) {
            jdbc.update("""
                    INSERT INTO dbo.equipo_asignacion
                        (equipo_asignacion_id, glpi_computer_id, persona_id, sede_id,
                         dependencia_id, subdependencia_id, codigo_patrimonial,
                         codigo_inventario, fecha_asignacion, estado)
                    VALUES (NEXT VALUE FOR dbo.seq_equipo_asignacion_id, ?, NULL, NULL,
                            NULL, NULL, NULL, NULL, NULL, 'PENDIENTE')
                    """, glpiComputerId);
        }
        log.info("equipo_asignacion: {} equipos nuevos sincronizados desde GLPI", faltantes.size());
    }

    public void sync(EquipoEnrichment enrichment) {
        Long personaId = findPersonaId(enrichment.getUsuarioAsignadoOverride());
        Long sedeId = enrichment.getSede() == null ? null : enrichment.getSede().getId();
        Long dependenciaId = enrichment.getDependencia() == null
                ? null : enrichment.getDependencia().getId();
        Long subdependenciaId = enrichment.getSubdependencia() == null
                ? null : enrichment.getSubdependencia().getId();
        String estado = blankToDefault(enrichment.getEstadoDepuracion(), "PENDIENTE");

        int updated = jdbc.update("""
                UPDATE dbo.equipo_asignacion SET
                    persona_id = ?, sede_id = ?, dependencia_id = ?,
                    subdependencia_id = ?, codigo_patrimonial = ?,
                    codigo_inventario = ?, estado = ?
                WHERE glpi_computer_id = ?
                """,
                personaId, sedeId, dependenciaId, subdependenciaId,
                blankToNull(enrichment.getCodigoPatrimonial()),
                blankToNull(enrichment.getCodigoInternoOverride()), estado,
                enrichment.getComputerId());

        if (updated == 0) {
            jdbc.update("""
                    INSERT INTO dbo.equipo_asignacion
                        (equipo_asignacion_id, glpi_computer_id, persona_id,
                         sede_id, dependencia_id, subdependencia_id,
                         codigo_patrimonial, codigo_inventario,
                         fecha_asignacion, estado)
                    VALUES (NEXT VALUE FOR dbo.seq_equipo_asignacion_id, ?, ?, ?,
                            ?, ?, ?, ?, CAST(GETDATE() AS DATE), ?)
                    """,
                    enrichment.getComputerId(), personaId, sedeId, dependenciaId,
                    subdependenciaId, blankToNull(enrichment.getCodigoPatrimonial()),
                    blankToNull(enrichment.getCodigoInternoOverride()), estado);
        }
    }

    private Long findPersonaId(String accountName) {
        String normalized = normalizeAccountName(accountName);
        if (normalized == null) {
            return null;
        }
        return jdbc.query(
                "SELECT TOP 1 persona_id FROM dbo.persona "
                        + "WHERE LOWER(sam_account_name) = LOWER(?)",
                rs -> rs.next() ? rs.getLong(1) : null,
                normalized);
    }

    private String normalizeAccountName(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return null;
        }
        int slash = Math.max(normalized.lastIndexOf('\\'), normalized.lastIndexOf('/'));
        if (slash >= 0) {
            normalized = normalized.substring(slash + 1);
        }
        int at = normalized.indexOf('@');
        if (at > 0) {
            normalized = normalized.substring(0, at);
        }
        return blankToNull(normalized);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String blankToDefault(String value, String defaultValue) {
        String normalized = blankToNull(value);
        return normalized == null ? defaultValue : normalized;
    }
}
