package com.inia.soportedesk.equipos;

import com.inia.soportedesk.catalogo.TipoEquipoCatalogo;
import com.inia.soportedesk.catalogo.TipoEquipoCatalogoRepository;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichment;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import com.inia.soportedesk.glpi.GlpiComputerOficinaRepository;
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

    private static final String DESKTOP = "Computadora de Escritorio";
    private static final String LAPTOP = "Laptop";
    private static final String ALL_IN_ONE = "All in One";
    private static final String SEDE_CENTRAL = "SEDE CENTRAL";

    private final VwInvComputerFullRepository repository;
    private final GlpiTecladoRepository tecladoRepository;
    private final GlpiComputerOficinaRepository oficinaRepository;
    private final TipoEquipoCatalogoRepository catalogoRepository;
    private final EquipoEnrichmentRepository enrichmentRepository;

    public List<VwInvComputerFull> findAll(String search, String sede, String tipo,
                                            String dependencia, String subdependencia, String fabricante) {
        List<VwInvComputerFull> items = repository.findFiltered(
                blankToNull(search), blankToNull(sede), blankToNull(tipo),
                blankToNull(dependencia), blankToNull(subdependencia), blankToNull(fabricante));
        applyEnrichments(items);
        return items;
    }

    public EquipoKpisDto getKpis() {
        List<VwInvComputerFull> equipos = repository.findFiltered(null, null, null, null, null, null);
        applyEnrichments(equipos);
        List<VwInvComputerFull> equiposComputo = equipos.stream().filter(this::esEquipoComputoAcordado).toList();
        long totalActivos = equiposComputo.size();
        long desktopCount = equiposComputo.stream().filter(e -> DESKTOP.equals(e.getTipoEquipo())).count();
        long laptopCount = equiposComputo.stream().filter(e -> LAPTOP.equals(e.getTipoEquipo())).count();
        long allInOneCount = equiposComputo.stream().filter(e -> ALL_IN_ONE.equals(e.getTipoEquipo())).count();
        long sedeCentralCount = equiposComputo.stream().filter(e -> SEDE_CENTRAL.equals(e.getSedeNombre())).count();
        long eeasCount = totalActivos - sedeCentralCount;
        return new EquipoKpisDto(totalActivos, desktopCount, laptopCount, allInOneCount, sedeCentralCount, eeasCount);
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
        applyEnrichment(equipo, enrichment);
        String tipoEfectivo = resolveTipo(equipo.getTipoEquipo(), enrichment);

        return new EquipoDetalleResponse(
                equipo,
                repository.findSoftwareByComputerId(id),
                tecladoRepository.findByItemsId(id).orElse(null),
                oficinaRepository.findByItemsId(id).orElse(null),
                tipoEfectivo);
    }

    public List<EquipoSaludDto> getSalud() {
        List<VwInvComputerFull> all = repository.findFiltered(null, null, null, null, null, null);
        applyEnrichments(all);
        List<Long> ids = all.stream().map(VwInvComputerFull::getComputerID).toList();
        Map<Long, EquipoEnrichment> enrichmentMap = enrichmentRepository.findByComputerIdIn(ids).stream()
                .collect(Collectors.toMap(EquipoEnrichment::getComputerId, e -> e));
        LocalDateTime now = LocalDateTime.now();
        return all.stream()
                .map(e -> buildSaludDto(e, enrichmentMap.get(e.getComputerID()), now))
                .filter(s -> !s.nivelAlerta().equals("OK")
                          || s.sinCodigoPatrimonial()
                          || s.sinUsuario()
                          || s.sinSede()
                          || s.sinDependencia()
                          || s.sinSubdependencia()
                          || s.sinNumeroSerie())
                .toList();
    }

    private record SaludCalculo(
            String nivel, boolean sinPatrimonial, boolean sinUsuario, boolean sinSede,
            boolean sinDependencia, boolean sinSubdependencia, boolean sinNumeroSerie,
            long sinEncendidoMeses, long sinActualizacionMeses) {
    }

    private SaludCalculo calcularSalud(VwInvComputerFull e, EquipoEnrichment enrichment, LocalDateTime now) {
        long sinEncendido = e.getUltimoEncendido() == null ? Long.MAX_VALUE :
                ChronoUnit.MONTHS.between(e.getUltimoEncendido(), now);
        long sinActualizacion = e.getUltimaActualizacion() == null ? Long.MAX_VALUE :
                ChronoUnit.MONTHS.between(e.getUltimaActualizacion(), now);

        String nivel;
        if (sinEncendido > 12 || sinActualizacion > 6) nivel = "ROJO";
        else if (sinEncendido > 6 || sinActualizacion > 3) nivel = "AMARILLO";
        else nivel = "OK";

        boolean sinPatrimonial = enrichment == null || blank(enrichment.getCodigoPatrimonial());
        boolean sinUsuario = blank(e.getUsuarioContacto());
        boolean sinSede = blank(e.getSedeNombre()) && (enrichment == null || enrichment.getSede() == null);
        boolean sinDependencia = blank(e.getOficinaId()) && (enrichment == null || enrichment.getDependencia() == null);
        boolean sinSubdependencia = blank(e.getUnidadId()) && (enrichment == null || enrichment.getSubdependencia() == null);
        boolean sinNumeroSerie = blank(e.getNumeroserie())
                && (enrichment == null || blank(enrichment.getNumeroSerieOverride()));

        return new SaludCalculo(nivel, sinPatrimonial, sinUsuario, sinSede,
                sinDependencia, sinSubdependencia, sinNumeroSerie,
                sinEncendido == Long.MAX_VALUE ? -1L : sinEncendido,
                sinActualizacion == Long.MAX_VALUE ? -1L : sinActualizacion);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private EquipoSaludDto buildSaludDto(VwInvComputerFull e, EquipoEnrichment enrichment, LocalDateTime now) {
        SaludCalculo calculo = calcularSalud(e, enrichment, now);
        String estadoDepuracion = enrichment != null ? enrichment.getEstadoDepuracion() : null;

        return new EquipoSaludDto(
                e.getComputerID(), e.getNombreEquipo(), e.getSedeNombre(), e.getTipoEquipo(),
                e.getUsuarioContacto(), e.getFechaCreacion(),
                calculo.sinEncendidoMeses(), calculo.sinActualizacionMeses(),
                calculo.nivel(), calculo.sinPatrimonial(), calculo.sinUsuario(), calculo.sinSede(),
                calculo.sinDependencia(), calculo.sinSubdependencia(), calculo.sinNumeroSerie(),
                estadoDepuracion);
    }

    public EquipoDashboardCompleto getDashboardCompleto() {
        try {
            List<VwInvComputerFull> equipos = repository.findFiltered(null, null, null, null, null, null);
            applyEnrichments(equipos);
            equipos = equipos.stream().filter(this::esEquipoComputoAcordado).toList();

            long total = equipos.size();
            long desktopCount = equipos.stream().filter(e -> DESKTOP.equals(e.getTipoEquipo())).count();
            long laptopCount = equipos.stream().filter(e -> LAPTOP.equals(e.getTipoEquipo())).count();
            long allInOneCount = equipos.stream().filter(e -> ALL_IN_ONE.equals(e.getTipoEquipo())).count();
            long sedeCentralCount = equipos.stream().filter(e -> SEDE_CENTRAL.equals(e.getSedeNombre())).count();
            long eeasCount = total - sedeCentralCount;
            long recientes30Dias = equipos.stream().filter(e -> e.getFechaCreacion() != null
                    && !e.getFechaCreacion().isBefore(LocalDateTime.now().minusDays(30))).count();
            LocalDateTime limiteActualizacion = LocalDateTime.now().minusMonths(3);
            long sinActualizarMasTresMeses = equipos.stream()
                    .filter(e -> e.getUltimaActualizacion() == null
                            || e.getUltimaActualizacion().isBefore(limiteActualizacion))
                    .count();

            List<EquipoFabricanteCount> distribucionPorFabricante = equipos.stream()
                    .collect(Collectors.groupingBy(
                            e -> e.getFabricanteEquipo() == null || e.getFabricanteEquipo().isBlank()
                                    ? "Sin fabricante" : e.getFabricanteEquipo(),
                            java.util.LinkedHashMap::new,
                            Collectors.counting()))
                    .entrySet().stream()
                    .map(entry -> new EquipoFabricanteCount(entry.getKey(), entry.getValue()))
                    .sorted(java.util.Comparator.comparing(EquipoFabricanteCount::fabricante))
                    .toList();

            List<EquipoDependenciaCount> topDependencias = equipos.stream()
                    .collect(Collectors.groupingBy(
                            e -> e.getOficinaId() == null || e.getOficinaId().isBlank()
                                    ? "Sin dependencia" : e.getOficinaId(),
                            java.util.LinkedHashMap::new,
                            Collectors.counting()))
                    .entrySet().stream()
                    .sorted(java.util.Map.Entry.<String, Long>comparingByValue(java.util.Comparator.reverseOrder()))
                    .map(entry -> new EquipoDependenciaCount(entry.getKey(), entry.getValue()))
                    .toList();

            List<EquipoSubdependenciaCount> topSubdependencias = equipos.stream()
                    .collect(Collectors.groupingBy(
                            e -> e.getUnidadId() == null || e.getUnidadId().isBlank()
                                    ? "Sin subdependencia" : e.getUnidadId(),
                            java.util.LinkedHashMap::new,
                            Collectors.counting()))
                    .entrySet().stream()
                    .sorted(java.util.Map.Entry.<String, Long>comparingByValue(java.util.Comparator.reverseOrder()))
                    .map(entry -> new EquipoSubdependenciaCount(entry.getKey(), entry.getValue()))
                    .toList();

            List<Long> ids = equipos.stream().map(VwInvComputerFull::getComputerID).toList();
            Map<Long, EquipoEnrichment> enrichmentMap = enrichmentRepository.findByComputerIdIn(ids).stream()
                    .collect(Collectors.toMap(EquipoEnrichment::getComputerId, e -> e));
            LocalDateTime now = LocalDateTime.now();

            long rojos = 0, amarillos = 0, ok = 0, sinPatrimonial = 0, sinUsuario = 0, sinSede = 0;
            for (VwInvComputerFull e : equipos) {
                SaludCalculo calculo = calcularSalud(e, enrichmentMap.get(e.getComputerID()), now);
                switch (calculo.nivel()) {
                    case "ROJO" -> rojos++;
                    case "AMARILLO" -> amarillos++;
                    default -> ok++;
                }
                if (calculo.sinPatrimonial()) sinPatrimonial++;
                if (calculo.sinUsuario()) sinUsuario++;
                if (calculo.sinSede()) sinSede++;
            }

            EquipoSaludResumen salud = new EquipoSaludResumen(rojos, amarillos, ok, sinPatrimonial, sinUsuario, sinSede);

            return new EquipoDashboardCompleto(
                    total, desktopCount, laptopCount, allInOneCount, sedeCentralCount, eeasCount, recientes30Dias,
                    sinActualizarMasTresMeses,
                    distribucionPorFabricante, topDependencias, topSubdependencias, salud);
        } catch (Exception ex) {
            return new EquipoDashboardCompleto(0, 0, 0, 0, 0, 0, 0, 0, List.of(), List.of(), List.of(),
                    new EquipoSaludResumen(0, 0, 0, 0, 0, 0));
        }
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

    private boolean esEquipoComputoAcordado(VwInvComputerFull equipo) {
        return DESKTOP.equals(equipo.getTipoEquipo())
                || LAPTOP.equals(equipo.getTipoEquipo())
                || ALL_IN_ONE.equals(equipo.getTipoEquipo());
    }

    private void applyEnrichments(List<VwInvComputerFull> items) {
        List<Long> ids = items.stream().map(VwInvComputerFull::getComputerID).toList();
        Map<Long, EquipoEnrichment> map = enrichmentRepository.findByComputerIdIn(ids).stream()
                .collect(Collectors.toMap(EquipoEnrichment::getComputerId, e -> e));
        Map<String, String> tipos = catalogoRepository.findByActivoTrue().stream()
                .collect(Collectors.toMap(TipoEquipoCatalogo::getGlpiValor, TipoEquipoCatalogo::getTipoNormalizado, (a, b) -> a));
        items.forEach(item -> {
            item.setTipoEquipo(tipos.getOrDefault(item.getTipoEquipo(), item.getTipoEquipo()));
            applyEnrichment(item, map.get(item.getComputerID()));
        });
    }

    private void applyEnrichment(VwInvComputerFull item, EquipoEnrichment e) {
        if (e == null) return;
        if (!blank(e.getTipoOverride())) item.setTipoEquipo(e.getTipoOverride());
        if (!blank(e.getNombreAsignadoOverride())) item.setUsuarioTelefono(e.getNombreAsignadoOverride());
        if (!blank(e.getUsuarioAsignadoOverride())) item.setUsuarioContacto(e.getUsuarioAsignadoOverride());
        if (!blank(e.getCodigoInternoOverride())) item.setCodigoInterno(e.getCodigoInternoOverride());
        if (!blank(e.getNumeroSerieOverride())) item.setNumeroserie(e.getNumeroSerieOverride());
        if (e.getSede() != null) item.setSedeNombre(e.getSede().getNombre());
        if (e.getDependencia() != null) item.setOficinaId(e.getDependencia().getNombre());
        if (e.getSubdependencia() != null) item.setUnidadId(e.getSubdependencia().getNombre());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
