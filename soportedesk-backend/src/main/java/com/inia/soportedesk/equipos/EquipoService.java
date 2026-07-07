package com.inia.soportedesk.equipos;

import com.inia.soportedesk.catalogo.TipoEquipoCatalogo;
import com.inia.soportedesk.catalogo.TipoEquipoCatalogoRepository;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichment;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentDto;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentRepository;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentService;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import com.inia.soportedesk.glpi.GlpiTecladoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipoService {

    private static final String DESKTOP = "Desktop";
    private static final String LAPTOP = "Laptop";
    private static final String SEDE_CENTRAL = "SEDE CENTRAL";

    private final VwInvComputerFullRepository repository;
    private final GlpiTecladoRepository tecladoRepository;
    private final TipoEquipoCatalogoRepository catalogoRepository;
    private final EquipoEnrichmentRepository enrichmentRepository;
    private final EquipoEnrichmentService enrichmentService;

    public List<VwInvComputerFull> findAll(String search, String sede, String tipo,
                                            String dependencia, String subdependencia, String fabricante) {
        return repository.findFiltered(
                blankToNull(search), blankToNull(sede), blankToNull(tipo),
                blankToNull(dependencia), blankToNull(subdependencia), blankToNull(fabricante));
    }

    public EquipoKpisDto getKpis() {
        List<VwInvComputerFull> equipos = repository.findFiltered(null, null, null, null, null, null);
        long totalActivos = equipos.size();
        long desktopCount = equipos.stream().filter(e -> DESKTOP.equals(e.getTipoEquipo())).count();
        long laptopCount = equipos.stream().filter(e -> LAPTOP.equals(e.getTipoEquipo())).count();
        long otrosCount = totalActivos - desktopCount - laptopCount;
        long sedeCentralCount = equipos.stream().filter(e -> SEDE_CENTRAL.equals(e.getSedeNombre())).count();
        long eeasCount = totalActivos - sedeCentralCount;
        return new EquipoKpisDto(totalActivos, desktopCount, laptopCount, otrosCount, sedeCentralCount, eeasCount);
    }

    public List<String> findSedes() { return repository.findDistinctSedes(); }
    public List<String> findTipos() { return repository.findDistinctTipos(); }
    public List<String> findDependencias(String sede) { return repository.findDistinctDependencias(blankToNull(sede)); }
    public List<String> findSubdependencias(String sede, String dep) { return repository.findDistinctSubdependencias(blankToNull(sede), blankToNull(dep)); }
    public List<String> findFabricantes() { return repository.findDistinctFabricantes(); }

    public EquipoDetalleResponse findById(Long id) {
        VwInvComputerFull equipo = repository.findById(id)
                .filter(e -> e.getEliminado() == null || e.getEliminado() == 0)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado: " + id));

        EquipoEnrichment enrichment = enrichmentRepository.findByComputerId(id).orElse(null);
        String tipoEfectivo = resolveTipo(equipo.getTipoEquipo(), enrichment);
        EquipoEnrichmentDto enrichmentDto = enrichment != null ? enrichmentService.toDto(enrichment) : null;

        return new EquipoDetalleResponse(
                equipo,
                repository.findSoftwareByComputerId(id),
                tecladoRepository.findByItemsId(id).orElse(null),
                tipoEfectivo,
                enrichmentDto);
    }

    public List<EquipoSaludDto> getSalud() {
        List<VwInvComputerFull> all = repository.findFiltered(null, null, null, null, null, null);
        List<Long> ids = all.stream().map(VwInvComputerFull::getComputerID).toList();
        Map<Long, EquipoEnrichment> enrichmentMap = enrichmentRepository.findByComputerIdIn(ids).stream()
                .collect(Collectors.toMap(EquipoEnrichment::getComputerId, e -> e));
        LocalDateTime now = LocalDateTime.now();
        return all.stream()
                .map(e -> buildSaludDto(e, enrichmentMap.get(e.getComputerID()), now))
                .filter(s -> !s.nivelAlerta().equals("OK")
                          || s.sinCodigoPatrimonial()
                          || s.sinUsuario()
                          || s.sinSede())
                .toList();
    }

    private EquipoSaludDto buildSaludDto(VwInvComputerFull e, EquipoEnrichment enrichment, LocalDateTime now) {
        long sinEncendido = e.getUltimoEncendido() == null ? Long.MAX_VALUE :
                ChronoUnit.MONTHS.between(e.getUltimoEncendido(), now);
        long sinActualizacion = e.getUltimaActualizacion() == null ? Long.MAX_VALUE :
                ChronoUnit.MONTHS.between(e.getUltimaActualizacion(), now);

        String nivel;
        if (sinEncendido > 12 || sinActualizacion > 6) nivel = "ROJO";
        else if (sinEncendido > 6 || sinActualizacion > 3) nivel = "AMARILLO";
        else nivel = "OK";

        boolean sinPatrimonial = enrichment == null || enrichment.getCodigoPatrimonial() == null
                || enrichment.getCodigoPatrimonial().isBlank();
        boolean sinUsuario = e.getUsuarioContacto() == null || e.getUsuarioContacto().isBlank();
        boolean sinSede = e.getSedeNombre() == null || e.getSedeNombre().isBlank();
        String estadoDepuracion = enrichment != null ? enrichment.getEstadoDepuracion() : null;

        return new EquipoSaludDto(
                e.getComputerID(), e.getNombreEquipo(), e.getSedeNombre(), e.getTipoEquipo(),
                e.getUsuarioContacto(),
                sinEncendido == Long.MAX_VALUE ? -1L : sinEncendido,
                sinActualizacion == Long.MAX_VALUE ? -1L : sinActualizacion,
                nivel, sinPatrimonial, sinUsuario, sinSede, estadoDepuracion);
    }

    private String resolveTipo(String glpiTipo, EquipoEnrichment enrichment) {
        if (enrichment != null && enrichment.getTipoOverride() != null) {
            return enrichment.getTipoOverride();
        }
        if (glpiTipo != null) {
            return catalogoRepository.findByGlpiValorAndActivoTrue(glpiTipo)
                    .map(TipoEquipoCatalogo::getTipoNormalizado)
                    .orElse(glpiTipo);
        }
        return glpiTipo;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
