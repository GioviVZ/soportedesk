package com.inia.soportedesk.equipos;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.TipoEquipoCatalogo;
import com.inia.soportedesk.catalogo.TipoEquipoCatalogoRepository;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichment;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentRepository;
import com.inia.soportedesk.glpi.GlpiComputerOficinaRepository;
import com.inia.soportedesk.glpi.GlpiTecladoRepository;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipoServiceTest {

    @Mock private VwInvComputerFullRepository repository;
    @Mock private GlpiTecladoRepository tecladoRepository;
    @Mock private GlpiComputerOficinaRepository oficinaRepository;
    @Mock private TipoEquipoCatalogoRepository catalogoRepository;
    @Mock private EquipoEnrichmentRepository enrichmentRepository;

    @InjectMocks
    private EquipoService service;

    @Test
    void findAll_delegatesFiltersToRepository() {
        VwInvComputerFull equipo = new VwInvComputerFull();
        equipo.setComputerID(10L);
        when(repository.findFiltered("ana", "SEDE CENTRAL", "Laptop", null, null, null)).thenReturn(List.of(equipo));

        List<VwInvComputerFull> result = service.findAll("ana", "SEDE CENTRAL", "Laptop", null, null, null);

        assertThat(result).containsExactly(equipo);
        verify(repository).findFiltered("ana", "SEDE CENTRAL", "Laptop", null, null, null);
    }

    @Test
    void getKpis_calculatesCountsByTypeAndSede() {
        VwInvComputerFull desktopCentral = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        VwInvComputerFull laptopEea = equipo("Laptop", "EEA ANDENES");
        VwInvComputerFull otroEea = equipo("Servidor", "EEA DONOSO");
        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(desktopCentral, laptopEea, otroEea));

        EquipoKpisDto result = service.getKpis();

        assertThat(result.totalActivos()).isEqualTo(3);
        assertThat(result.desktopCount()).isEqualTo(1);
        assertThat(result.laptopCount()).isEqualTo(1);
        assertThat(result.otrosCount()).isEqualTo(1);
        assertThat(result.sedeCentralCount()).isEqualTo(1);
        assertThat(result.eeasCount()).isEqualTo(2);
    }

    @Test
    void findById_tipoOverride_winsOverGlpiAndCatalog() {
        VwInvComputerFull glpiEquipo = equipo("Laptop", "SEDE CENTRAL");
        glpiEquipo.setComputerID(1L);
        glpiEquipo.setEliminado(0);

        EquipoEnrichment enrichment = new EquipoEnrichment();
        enrichment.setComputerId(1L);
        enrichment.setTipoOverride("Workstation");

        when(repository.findById(1L)).thenReturn(Optional.of(glpiEquipo));
        when(enrichmentRepository.findByComputerId(1L)).thenReturn(Optional.of(enrichment));
        when(repository.findSoftwareByComputerId(1L)).thenReturn(List.of());
        when(tecladoRepository.findByItemsId(1L)).thenReturn(Optional.empty());

        EquipoDetalleResponse result = service.findById(1L);

        assertThat(result.tipoEfectivo()).isEqualTo("Workstation");
        verify(catalogoRepository, never()).findByGlpiValorAndActivoTrue(any());
    }

    @Test
    void findById_catalogMapping_appliedWhenNoOverride() {
        VwInvComputerFull glpiEquipo = equipo("Laptop", "SEDE CENTRAL");
        glpiEquipo.setComputerID(2L);
        glpiEquipo.setEliminado(0);

        TipoEquipoCatalogo catalogo = new TipoEquipoCatalogo();
        catalogo.setTipoNormalizado("Portátil");

        when(repository.findById(2L)).thenReturn(Optional.of(glpiEquipo));
        when(enrichmentRepository.findByComputerId(2L)).thenReturn(Optional.empty());
        when(catalogoRepository.findByGlpiValorAndActivoTrue("Laptop")).thenReturn(Optional.of(catalogo));
        when(repository.findSoftwareByComputerId(2L)).thenReturn(List.of());
        when(tecladoRepository.findByItemsId(2L)).thenReturn(Optional.empty());

        EquipoDetalleResponse result = service.findById(2L);

        assertThat(result.tipoEfectivo()).isEqualTo("Portátil");
    }

    @Test
    void findById_rawGlpiValue_whenNoCatalogMatch() {
        VwInvComputerFull glpiEquipo = equipo("ServidorRaro", "EEA DONOSO");
        glpiEquipo.setComputerID(3L);
        glpiEquipo.setEliminado(0);

        when(repository.findById(3L)).thenReturn(Optional.of(glpiEquipo));
        when(enrichmentRepository.findByComputerId(3L)).thenReturn(Optional.empty());
        when(catalogoRepository.findByGlpiValorAndActivoTrue("ServidorRaro")).thenReturn(Optional.empty());
        when(repository.findSoftwareByComputerId(3L)).thenReturn(List.of());
        when(tecladoRepository.findByItemsId(3L)).thenReturn(Optional.empty());

        EquipoDetalleResponse result = service.findById(3L);

        assertThat(result.tipoEfectivo()).isEqualTo("ServidorRaro");
    }

    @Test
    void getSalud_rojoWhenSinEncendidoMasDe12Meses() {
        VwInvComputerFull viejo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        viejo.setComputerID(5L);
        viejo.setNombreEquipo("PC-VIEJA");
        viejo.setUsuarioContacto("juanito");
        viejo.setUltimoEncendido(LocalDateTime.now().minusMonths(14));
        viejo.setUltimaActualizacion(LocalDateTime.now().minusMonths(1));

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(viejo));
        when(enrichmentRepository.findByComputerIdIn(List.of(5L))).thenReturn(List.of());

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nivelAlerta()).isEqualTo("ROJO");
    }

    @Test
    void getSalud_okEquiposExcluded_unlessDataMissing() {
        VwInvComputerFull bueno = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        bueno.setComputerID(6L);
        bueno.setNombreEquipo("PC-BUENA");
        bueno.setUsuarioContacto("maria");
        bueno.setUltimoEncendido(LocalDateTime.now().minusMonths(1));
        bueno.setUltimaActualizacion(LocalDateTime.now().minusMonths(1));
        bueno.setOficinaId("UTI");
        bueno.setUnidadId("Soporte");
        bueno.setNumeroserie("SN-BUENA");

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(6L);
        enrich.setCodigoPatrimonial("PAT-001");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(bueno));
        when(enrichmentRepository.findByComputerIdIn(List.of(6L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).isEmpty();
    }

    @Test
    void getSalud_sinDependencia_trueWhenGlpiEmptyAndNoOverride() {
        VwInvComputerFull equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerID(40L);
        equipo.setUsuarioContacto("ana");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie("SN-40");
        equipo.setOficinaId(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(40L);
        enrich.setCodigoPatrimonial("PAT-40");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(40L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).sinDependencia()).isTrue();
    }

    @Test
    void getSalud_sinDependencia_falseWhenOverridePresent() {
        VwInvComputerFull equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerID(41L);
        equipo.setUsuarioContacto("ana");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie("SN-41");
        equipo.setOficinaId(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        Dependencia dependencia = new Dependencia();
        dependencia.setId(1L);
        dependencia.setNombre("UTI");
        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(41L);
        enrich.setCodigoPatrimonial("PAT-41");
        enrich.setDependencia(dependencia);

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(41L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).isEmpty();
    }

    @Test
    void getSalud_sinDependencia_falseWhenGlpiHasData() {
        VwInvComputerFull equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerID(42L);
        equipo.setUsuarioContacto("ana");
        equipo.setOficinaId("UTI");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie("SN-42");
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(42L);
        enrich.setCodigoPatrimonial("PAT-42");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(42L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).isEmpty();
    }

    @Test
    void getSalud_sinSubdependencia_trueWhenGlpiEmptyAndNoOverride() {
        VwInvComputerFull equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerID(43L);
        equipo.setUsuarioContacto("ana");
        equipo.setOficinaId("UTI");
        equipo.setNumeroserie("SN-43");
        equipo.setUnidadId(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(43L);
        enrich.setCodigoPatrimonial("PAT-43");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(43L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).sinSubdependencia()).isTrue();
    }

    @Test
    void getSalud_sinNumeroSerie_trueWhenGlpiEmptyAndNoOverride() {
        VwInvComputerFull equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerID(44L);
        equipo.setUsuarioContacto("ana");
        equipo.setOficinaId("UTI");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(44L);
        enrich.setCodigoPatrimonial("PAT-44");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(44L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).sinNumeroSerie()).isTrue();
    }

    @Test
    void getSalud_sinNumeroSerie_falseWhenOverridePresent() {
        VwInvComputerFull equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerID(45L);
        equipo.setUsuarioContacto("ana");
        equipo.setOficinaId("UTI");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(45L);
        enrich.setCodigoPatrimonial("PAT-45");
        enrich.setNumeroSerieOverride("SN-OVERRIDE");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(45L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).isEmpty();
    }

    @Test
    void getDashboardCompleto_aggregatesFabricanteDependenciaAndSaludCounts() {
        VwInvComputerFull e1 = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        e1.setComputerID(1L);
        e1.setFabricanteEquipo("Dell");
        e1.setOficinaId("UTI");
        e1.setUsuarioContacto("ana");
        e1.setUltimoEncendido(LocalDateTime.now());
        e1.setUltimaActualizacion(LocalDateTime.now());

        VwInvComputerFull e2 = equipo("Laptop", "EEA ANDENES");
        e2.setComputerID(2L);
        e2.setFabricanteEquipo("HP");
        e2.setOficinaId("UTI");
        e2.setUsuarioContacto(null);
        e2.setUltimoEncendido(LocalDateTime.now().minusMonths(14));
        e2.setUltimaActualizacion(LocalDateTime.now());

        VwInvComputerFull e3 = equipo("Servidor", null);
        e3.setComputerID(3L);
        e3.setFabricanteEquipo("Dell");
        e3.setOficinaId("OGRH");
        e3.setUsuarioContacto("beto");
        e3.setUltimoEncendido(LocalDateTime.now().minusMonths(7));
        e3.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrichE1 = new EquipoEnrichment();
        enrichE1.setComputerId(1L);
        enrichE1.setCodigoPatrimonial("PAT-1");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(e1, e2, e3));
        when(enrichmentRepository.findByComputerIdIn(List.of(1L, 2L, 3L))).thenReturn(List.of(enrichE1));

        EquipoDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.total()).isEqualTo(3);
        assertThat(result.desktopCount()).isEqualTo(1);
        assertThat(result.laptopCount()).isEqualTo(1);
        assertThat(result.otrosCount()).isEqualTo(1);
        assertThat(result.sedeCentralCount()).isEqualTo(1);
        assertThat(result.eeasCount()).isEqualTo(2);

        assertThat(result.distribucionPorFabricante())
                .extracting(EquipoFabricanteCount::fabricante, EquipoFabricanteCount::total)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Dell", 2L),
                        org.assertj.core.groups.Tuple.tuple("HP", 1L)
                );

        assertThat(result.topDependencias())
                .extracting(EquipoDependenciaCount::dependencia, EquipoDependenciaCount::total)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("UTI", 2L),
                        org.assertj.core.groups.Tuple.tuple("OGRH", 1L)
                );

        assertThat(result.salud().rojos()).isEqualTo(1);
        assertThat(result.salud().amarillos()).isEqualTo(1);
        assertThat(result.salud().ok()).isEqualTo(1);
        assertThat(result.salud().sinPatrimonial()).isEqualTo(2);
        assertThat(result.salud().sinUsuario()).isEqualTo(1);
        assertThat(result.salud().sinSede()).isEqualTo(1);
    }

    @Test
    void getDashboardCompleto_onException_returnsEmptyDashboard() {
        when(repository.findFiltered(null, null, null, null, null, null)).thenThrow(new RuntimeException("db down"));

        EquipoDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.total()).isEqualTo(0);
        assertThat(result.distribucionPorFabricante()).isEmpty();
        assertThat(result.topDependencias()).isEmpty();
        assertThat(result.salud().rojos()).isEqualTo(0);
    }

    private VwInvComputerFull equipo(String tipo, String sede) {
        VwInvComputerFull equipo = new VwInvComputerFull();
        equipo.setTipoEquipo(tipo);
        equipo.setSedeNombre(sede);
        return equipo;
    }
}
