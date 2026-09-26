package com.inia.soportedesk.equipos;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.TipoEquipoCatalogo;
import com.inia.soportedesk.catalogo.TipoEquipoCatalogoRepository;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichment;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentRepository;
import com.inia.soportedesk.equipos.glpicache.EquipoGlpiCache;
import com.inia.soportedesk.equipos.glpicache.EquipoGlpiCacheRepository;
import com.inia.soportedesk.equipos.glpicache.EquipoGlpiCacheSyncService;
import com.inia.soportedesk.glpi.GlpiComputerOficinaRepository;
import com.inia.soportedesk.glpi.GlpiTecladoRepository;
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

    @Mock private VwInvComputerFullRepository glpiViewRepository;
    @Mock private EquipoGlpiCacheRepository repository;
    @Mock private EquipoGlpiCacheSyncService glpiCacheSyncService;
    @Mock private GlpiTecladoRepository tecladoRepository;
    @Mock private GlpiComputerOficinaRepository oficinaRepository;
    @Mock private TipoEquipoCatalogoRepository catalogoRepository;
    @Mock private EquipoEnrichmentRepository enrichmentRepository;

    @InjectMocks
    private EquipoService service;

    @Test
    void findAll_delegatesFiltersToRepository() {
        EquipoGlpiCache equipo = new EquipoGlpiCache();
        equipo.setComputerId(10L);
        equipo.setFabricanteEquipo("Fabricante GLPI");
        equipo.setModeloEquipo("Modelo GLPI");
        EquipoEnrichment enrichment = new EquipoEnrichment();
        enrichment.setComputerId(10L);
        enrichment.setFabricanteOverride("Marca verificada");
        enrichment.setModeloOverride("Modelo verificado");
        when(repository.findFiltered("ana", "SEDE CENTRAL", "Laptop", null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(10L))).thenReturn(List.of(enrichment));

        List<EquipoGlpiCache> result = service.findAll("ana", "SEDE CENTRAL", "Laptop", null, null, null);

        assertThat(result).containsExactly(equipo);
        assertThat(result.get(0).getFabricanteEquipo()).isEqualTo("Marca verificada");
        assertThat(result.get(0).getModeloEquipo()).isEqualTo("Modelo verificado");
        verify(repository).findFiltered("ana", "SEDE CENTRAL", "Laptop", null, null, null);
    }

    @Test
    void findAll_populatesAnydeskAndRustdeskIds() {
        EquipoGlpiCache equipo = new EquipoGlpiCache();
        equipo.setComputerId(10L);
        equipo.setAnydeskId("1576892737");
        equipo.setRustdeskId("183165540");
        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(10L))).thenReturn(List.of());

        List<EquipoGlpiCache> result = service.findAll(null, null, null, null, null, null);

        assertThat(result.get(0).getAnydeskId()).isEqualTo("1576892737");
        assertThat(result.get(0).getRustdeskId()).isEqualTo("183165540");
    }

    @Test
    void findAll_populatesCodigoPatrimonialAndMonitorOverridesFromEnrichment() {
        EquipoGlpiCache equipo = new EquipoGlpiCache();
        equipo.setComputerId(12L);
        EquipoEnrichment enrichment = new EquipoEnrichment();
        enrichment.setComputerId(12L);
        enrichment.setCodigoPatrimonial("74089500.0001");
        enrichment.setMonitorFabricanteOverride("Samsung");
        enrichment.setMonitorModeloOverride("S24F350");
        enrichment.setMonitorNumeroSerieOverride("MON-SN-001");
        enrichment.setMonitorCodigoPatrimonial("74089500.0002");
        enrichment.setMonitorCodigoInternoOverride("202405999");
        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(12L))).thenReturn(List.of(enrichment));

        List<EquipoGlpiCache> result = service.findAll(null, null, null, null, null, null);

        assertThat(result.get(0).getCodigoPatrimonial()).isEqualTo("74089500.0001");
        assertThat(result.get(0).getMonitorFabricanteOverride()).isEqualTo("Samsung");
        assertThat(result.get(0).getMonitorModeloOverride()).isEqualTo("S24F350");
        assertThat(result.get(0).getMonitorNumeroSerieOverride()).isEqualTo("MON-SN-001");
        assertThat(result.get(0).getMonitorCodigoPatrimonial()).isEqualTo("74089500.0002");
        assertThat(result.get(0).getMonitorCodigoInternoOverride()).isEqualTo("202405999");
    }

    @Test
    void findAll_populatesTecladoFieldsWhenRegistered() {
        EquipoGlpiCache equipo = new EquipoGlpiCache();
        equipo.setComputerId(13L);
        equipo.setTecladoMarca("HP");
        equipo.setTecladoModelo("KB-100");
        equipo.setTecladoNumeroSerie("SN-TEC-001");
        equipo.setTecladoCodigoInventario("202405001");
        equipo.setTecladoCodigoPatrimonial("74089500.0003");
        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(13L))).thenReturn(List.of());

        List<EquipoGlpiCache> result = service.findAll(null, null, null, null, null, null);

        assertThat(result.get(0).getTecladoMarca()).isEqualTo("HP");
        assertThat(result.get(0).getTecladoModelo()).isEqualTo("KB-100");
        assertThat(result.get(0).getTecladoNumeroSerie()).isEqualTo("SN-TEC-001");
        assertThat(result.get(0).getTecladoCodigoInventario()).isEqualTo("202405001");
        assertThat(result.get(0).getTecladoCodigoPatrimonial()).isEqualTo("74089500.0003");
    }

    @Test
    void findAll_singleMonitor_populatesOnlyMonitor1() {
        EquipoGlpiCache equipo = new EquipoGlpiCache();
        equipo.setComputerId(14L);
        equipo.setMonitor1Nombre("DELL E2417H");
        equipo.setMonitor1Serie("T4KPW96Q1VRL");
        equipo.setMonitor1Marca("Dell Inc.");
        equipo.setMonitor1Modelo("DELL E2417H");
        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(14L))).thenReturn(List.of());

        List<EquipoGlpiCache> result = service.findAll(null, null, null, null, null, null);

        assertThat(result.get(0).getMonitor1Marca()).isEqualTo("Dell Inc.");
        assertThat(result.get(0).getMonitor1Modelo()).isEqualTo("DELL E2417H");
        assertThat(result.get(0).getMonitor1Serie()).isEqualTo("T4KPW96Q1VRL");
        assertThat(result.get(0).getMonitor2Marca()).isNull();
        assertThat(result.get(0).getMonitor2Serie()).isNull();
    }

    @Test
    void findAll_twoMonitors_populatesBothSeparately() {
        EquipoGlpiCache equipo = new EquipoGlpiCache();
        equipo.setComputerId(15L);
        equipo.setMonitor1Nombre("T32p-30");
        equipo.setMonitor1Serie("V30BG6N0");
        equipo.setMonitor1Marca("Lenovo Group Limited");
        equipo.setMonitor1Modelo("T32p-30");
        equipo.setMonitor2Nombre("T27hv-30");
        equipo.setMonitor2Serie("VTU36257");
        equipo.setMonitor2Marca("Lenovo Group Limited");
        equipo.setMonitor2Modelo("T27hv-30");
        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(15L))).thenReturn(List.of());

        List<EquipoGlpiCache> result = service.findAll(null, null, null, null, null, null);

        assertThat(result.get(0).getMonitor1Serie()).isEqualTo("V30BG6N0");
        assertThat(result.get(0).getMonitor2Serie()).isEqualTo("VTU36257");
        assertThat(result.get(0).getMonitor1Modelo()).isEqualTo("T32p-30");
        assertThat(result.get(0).getMonitor2Modelo()).isEqualTo("T27hv-30");
    }

    @Test
    void findAll_noRemoteManagementRecords_leavesIdsNull() {
        EquipoGlpiCache equipo = new EquipoGlpiCache();
        equipo.setComputerId(11L);
        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(11L))).thenReturn(List.of());

        List<EquipoGlpiCache> result = service.findAll(null, null, null, null, null, null);

        assertThat(result.get(0).getAnydeskId()).isNull();
        assertThat(result.get(0).getRustdeskId()).isNull();
    }

    @Test
    void getKpis_calculatesCountsByTypeAndSede() {
        EquipoGlpiCache desktopCentral = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        EquipoGlpiCache laptopEea = equipo("Laptop", "EEA ANDENES");
        EquipoGlpiCache allInOneEea = equipo("Space-Saving", "EEA DONOSO");
        EquipoGlpiCache servidorFueraDelConteo = equipo("Servidor", "SEDE CENTRAL");
        TipoEquipoCatalogo allInOneCatalogo = new TipoEquipoCatalogo();
        allInOneCatalogo.setGlpiValor("Space-Saving");
        allInOneCatalogo.setTipoNormalizado("All in One");
        when(repository.findFiltered(null, null, null, null, null, null))
                .thenReturn(List.of(desktopCentral, laptopEea, allInOneEea, servidorFueraDelConteo));
        when(catalogoRepository.findByActivoTrue()).thenReturn(List.of(allInOneCatalogo));

        EquipoKpisDto result = service.getKpis();

        assertThat(result.totalActivos()).isEqualTo(3);
        assertThat(result.desktopCount()).isEqualTo(1);
        assertThat(result.laptopCount()).isEqualTo(1);
        assertThat(result.allInOneCount()).isEqualTo(1);
        assertThat(result.sedeCentralCount()).isEqualTo(1);
        assertThat(result.eeasCount()).isEqualTo(2);
    }

    @Test
    void findById_tipoOverride_winsOverGlpiAndCatalog() {
        EquipoGlpiCache glpiEquipo = equipo("Laptop", "SEDE CENTRAL");
        glpiEquipo.setComputerId(1L);
        glpiEquipo.setEliminado(0);

        EquipoEnrichment enrichment = new EquipoEnrichment();
        enrichment.setComputerId(1L);
        enrichment.setTipoOverride("Workstation");

        when(glpiCacheSyncService.resincronizarUno(1L)).thenReturn(Optional.of(glpiEquipo));
        when(enrichmentRepository.findByComputerId(1L)).thenReturn(Optional.of(enrichment));
        when(glpiViewRepository.findSoftwareByComputerId(1L)).thenReturn(List.of());
        when(tecladoRepository.findByItemsId(1L)).thenReturn(Optional.empty());

        EquipoDetalleResponse result = service.findById(1L);

        assertThat(result.tipoEfectivo()).isEqualTo("Workstation");
        verify(catalogoRepository, never()).findByGlpiValorAndActivoTrue(any());
    }

    @Test
    void findById_catalogMapping_appliedWhenNoOverride() {
        EquipoGlpiCache glpiEquipo = equipo("Laptop", "SEDE CENTRAL");
        glpiEquipo.setComputerId(2L);
        glpiEquipo.setEliminado(0);

        TipoEquipoCatalogo catalogo = new TipoEquipoCatalogo();
        catalogo.setTipoNormalizado("Portátil");

        when(glpiCacheSyncService.resincronizarUno(2L)).thenReturn(Optional.of(glpiEquipo));
        when(enrichmentRepository.findByComputerId(2L)).thenReturn(Optional.empty());
        when(catalogoRepository.findByGlpiValorAndActivoTrue("Laptop")).thenReturn(Optional.of(catalogo));
        when(glpiViewRepository.findSoftwareByComputerId(2L)).thenReturn(List.of());
        when(tecladoRepository.findByItemsId(2L)).thenReturn(Optional.empty());

        EquipoDetalleResponse result = service.findById(2L);

        assertThat(result.tipoEfectivo()).isEqualTo("Portátil");
    }

    @Test
    void findById_rawGlpiValue_whenNoCatalogMatch() {
        EquipoGlpiCache glpiEquipo = equipo("ServidorRaro", "EEA DONOSO");
        glpiEquipo.setComputerId(3L);
        glpiEquipo.setEliminado(0);

        when(glpiCacheSyncService.resincronizarUno(3L)).thenReturn(Optional.of(glpiEquipo));
        when(enrichmentRepository.findByComputerId(3L)).thenReturn(Optional.empty());
        when(catalogoRepository.findByGlpiValorAndActivoTrue("ServidorRaro")).thenReturn(Optional.empty());
        when(glpiViewRepository.findSoftwareByComputerId(3L)).thenReturn(List.of());
        when(tecladoRepository.findByItemsId(3L)).thenReturn(Optional.empty());

        EquipoDetalleResponse result = service.findById(3L);

        assertThat(result.tipoEfectivo()).isEqualTo("ServidorRaro");
    }

    @Test
    void getSalud_rojoWhenSinEncendidoMasDe12Meses() {
        EquipoGlpiCache viejo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        viejo.setComputerId(5L);
        viejo.setNombreEquipo("PC-VIEJA");
        viejo.setUsuarioContacto("juanito");
        viejo.setOficinaId("Dirección de Tecnología");
        viejo.setUnidadId("Oficina de Soporte");
        viejo.setFabricanteEquipo("Dell");
        viejo.setModeloEquipo("OptiPlex 7090");
        viejo.setUltimoEncendido(LocalDateTime.now().minusMonths(14));
        viejo.setUltimaActualizacion(LocalDateTime.now().minusMonths(1));

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(viejo));
        when(enrichmentRepository.findByComputerIdIn(List.of(5L))).thenReturn(List.of());

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nivelAlerta()).isEqualTo("ROJO");
        assertThat(result.get(0).sedeNombre()).isEqualTo("SEDE CENTRAL");
        assertThat(result.get(0).dependenciaNombre()).isEqualTo("Dirección de Tecnología");
        assertThat(result.get(0).subdependenciaNombre()).isEqualTo("Oficina de Soporte");
        assertThat(result.get(0).fabricanteEquipo()).isEqualTo("Dell");
        assertThat(result.get(0).modeloEquipo()).isEqualTo("OptiPlex 7090");
    }

    @Test
    void getSalud_okEquiposIncluded_conBanderasEnFalse() {
        EquipoGlpiCache bueno = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        bueno.setComputerId(6L);
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

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nivelAlerta()).isEqualTo("OK");
        assertThat(result.get(0).sinCodigoPatrimonial()).isFalse();
        assertThat(result.get(0).sinUsuario()).isFalse();
        assertThat(result.get(0).sinDependencia()).isFalse();
        assertThat(result.get(0).sinSubdependencia()).isFalse();
        assertThat(result.get(0).sinNumeroSerie()).isFalse();
    }

    @Test
    void getSalud_sinDependencia_trueWhenGlpiEmptyAndNoOverride() {
        EquipoGlpiCache equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerId(40L);
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
        EquipoGlpiCache equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerId(41L);
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

        assertThat(result).hasSize(1);
        assertThat(result.get(0).sinDependencia()).isFalse();
    }

    @Test
    void getSalud_sinDependencia_falseWhenGlpiHasData() {
        EquipoGlpiCache equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerId(42L);
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

        assertThat(result).hasSize(1);
        assertThat(result.get(0).sinDependencia()).isFalse();
    }

    @Test
    void getSalud_sinSubdependencia_trueWhenGlpiEmptyAndNoOverride() {
        EquipoGlpiCache equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerId(43L);
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
        EquipoGlpiCache equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerId(44L);
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
        EquipoGlpiCache equipo = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        equipo.setComputerId(45L);
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

        assertThat(result).hasSize(1);
        assertThat(result.get(0).sinNumeroSerie()).isFalse();
    }

    @Test
    void getDashboardCompleto_aggregatesFabricanteDependenciaAndSaludCounts() {
        EquipoGlpiCache e1 = equipo("Computadora de Escritorio", "SEDE CENTRAL");
        e1.setComputerId(1L);
        e1.setFabricanteEquipo("Dell");
        e1.setOficinaId("UTI");
        e1.setUnidadId("Soporte");
        e1.setUsuarioContacto("ana");
        e1.setUltimoEncendido(LocalDateTime.now());
        e1.setUltimaActualizacion(LocalDateTime.now());

        EquipoGlpiCache e2 = equipo("Laptop", "EEA ANDENES");
        e2.setComputerId(2L);
        e2.setFabricanteEquipo("HP");
        e2.setOficinaId("UTI");
        e2.setUnidadId("Infraestructura");
        e2.setUsuarioContacto(null);
        e2.setUltimoEncendido(LocalDateTime.now().minusMonths(14));
        e2.setUltimaActualizacion(LocalDateTime.now());

        EquipoGlpiCache e3 = equipo("All in One", null);
        e3.setComputerId(3L);
        e3.setFabricanteEquipo("Dell");
        e3.setOficinaId("OGRH");
        e3.setUnidadId("Bienestar");
        e3.setUsuarioContacto("beto");
        e3.setUltimoEncendido(LocalDateTime.now().minusMonths(7));
        e3.setUltimaActualizacion(LocalDateTime.now());

        EquipoGlpiCache servidorFueraDelConteo = equipo("Servidor", "SEDE CENTRAL");
        servidorFueraDelConteo.setComputerId(4L);
        servidorFueraDelConteo.setFabricanteEquipo("Lenovo");
        servidorFueraDelConteo.setOficinaId("UTI");

        EquipoEnrichment enrichE1 = new EquipoEnrichment();
        enrichE1.setComputerId(1L);
        enrichE1.setCodigoPatrimonial("PAT-1");

        when(repository.findFiltered(null, null, null, null, null, null))
                .thenReturn(List.of(e1, e2, e3, servidorFueraDelConteo));
        when(enrichmentRepository.findByComputerIdIn(List.of(1L, 2L, 3L, 4L))).thenReturn(List.of(enrichE1));
        when(enrichmentRepository.findByComputerIdIn(List.of(1L, 2L, 3L))).thenReturn(List.of(enrichE1));

        EquipoDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.total()).isEqualTo(3);
        assertThat(result.desktopCount()).isEqualTo(1);
        assertThat(result.laptopCount()).isEqualTo(1);
        assertThat(result.allInOneCount()).isEqualTo(1);
        assertThat(result.sedeCentralCount()).isEqualTo(1);
        assertThat(result.eeasCount()).isEqualTo(2);

        assertThat(result.distribucionPorFabricante())
                .extracting(EquipoFabricanteCount::fabricante, EquipoFabricanteCount::total)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Dell", 2L),
                        org.assertj.core.groups.Tuple.tuple("HP", 1L)
                );

        assertThat(result.topSubdependencias())
                .extracting(EquipoSubdependenciaCount::subdependencia, EquipoSubdependenciaCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("Soporte", 1L),
                        org.assertj.core.groups.Tuple.tuple("Infraestructura", 1L),
                        org.assertj.core.groups.Tuple.tuple("Bienestar", 1L)
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
        assertThat(result.topSubdependencias()).isEmpty();
        assertThat(result.salud().rojos()).isEqualTo(0);
    }

    private EquipoGlpiCache equipo(String tipo, String sede) {
        EquipoGlpiCache equipo = new EquipoGlpiCache();
        equipo.setTipoEquipo(tipo);
        equipo.setSedeNombre(sede);
        return equipo;
    }
}
