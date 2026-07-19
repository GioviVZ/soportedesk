package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.MarcaImpresora;
import com.inia.soportedesk.catalogo.ModeloImpresora;
import com.inia.soportedesk.catalogo.ModeloImpresoraRepository;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.catalogo.TipoImpresora;
import com.inia.soportedesk.catalogo.TipoImpresoraRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.impresoras.intervencion.ImpresoraIntervencionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImpresoraServiceTest {

    @Mock
    private ImpresoraRepository repository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private DependenciaRepository dependenciaRepository;

    @Mock
    private SubdependenciaRepository subdependenciaRepository;

    @Mock
    private TipoImpresoraRepository tipoImpresoraRepository;

    @Mock
    private ModeloImpresoraRepository modeloImpresoraRepository;

    @Mock
    private ImpresoraIntervencionService intervencionService;

    @InjectMocks
    private ImpresoraService service;

    private ModeloImpresora modeloImpresora() {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");

        ModeloImpresora modelo = new ModeloImpresora();
        modelo.setId(1L);
        modelo.setMarca(marca);
        modelo.setNombre("M404dn");
        return modelo;
    }

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setModeloImpresoraId(1L);
        request.setTipoConexion("IP");
        request.setIp("10.0.0.50");
        request.setSerie("SN-12345");
        request.setCodigoInventario("INV-001");
        request.setCodigoPatrimonial("PAT-001");
        request.setReferencia("Piso 3 - Oficina de Compras");
        request.setEstado("Activa");
        return request;
    }

    private Impresora sampleImpresora(Long id) {
        Impresora imp = new Impresora();
        imp.setId(id);
        imp.setModeloImpresora(modeloImpresora());
        imp.setTipoConexion("IP");
        imp.setIp("10.0.0.50");
        imp.setSerie("SN-12345");
        imp.setCodigoInventario("INV-001");
        imp.setCodigoPatrimonial("PAT-001");
        imp.setReferencia("Piso 3 - Oficina de Compras");
        imp.setEstado("Activa");
        return imp;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(sampleImpresora(1L)));

        List<Impresora> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesImpresoraWithModeloImpresora() {
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(sampleRequest());

        assertThat(result.getModeloImpresora().getNombre()).isEqualTo("M404dn");
        assertThat(result.getModeloImpresora().getMarca().getNombre()).isEqualTo("HP");
        assertThat(result.getSerie()).isEqualTo("SN-12345");
        assertThat(result.getReferencia()).isEqualTo("Piso 3 - Oficina de Compras");
    }

    @Test
    void create_withDuplicatedSerie_rejectsRequestBeforeSaving() {
        when(repository.existsBySerieIgnoreCase("SN-12345")).thenReturn(true);

        assertThatThrownBy(() -> service.create(sampleRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("serie SN-12345");
    }

    @Test
    void create_withDuplicatedInventoryCode_rejectsRequestBeforeSaving() {
        when(repository.existsByCodigoInventarioIgnoreCase("INV-001")).thenReturn(true);

        assertThatThrownBy(() -> service.create(sampleRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("codigo de inventario INV-001");
    }

    @Test
    void create_withDuplicatedPatrimonialCode_rejectsRequestBeforeSaving() {
        when(repository.existsByCodigoPatrimonialIgnoreCase("PAT-001")).thenReturn(true);

        assertThatThrownBy(() -> service.create(sampleRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("codigo patrimonial PAT-001");
    }

    @Test
    void create_withDuplicatedIp_rejectsRequestBeforeSaving() {
        when(repository.existsByIpIgnoreCase("10.0.0.50")).thenReturn(true);

        assertThatThrownBy(() -> service.create(sampleRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("10.0.0.50");
    }

    @Test
    void create_withIpConnectionAndBlankIp_rejectsRequest() {
        ImpresoraRequest request = sampleRequest();
        request.setIp(" ");

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Debe ingresar la direccion IP");
    }

    @Test
    void create_withMalformedIp_rejectsRequest() {
        ImpresoraRequest request = sampleRequest();
        request.setIp("999.1.2.3");

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no es valida");
    }

    @Test
    void update_withOwnIdentifiers_doesNotTreatCurrentPrinterAsDuplicate() {
        when(repository.findById(8L)).thenReturn(Optional.of(sampleImpresora(8L)));
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.update(8L, sampleRequest());

        assertThat(result.getId()).isEqualTo(8L);
        verify(repository).existsBySerieIgnoreCaseAndIdNot("SN-12345", 8L);
        verify(repository).existsByCodigoInventarioIgnoreCaseAndIdNot("INV-001", 8L);
        verify(repository).existsByCodigoPatrimonialIgnoreCaseAndIdNot("PAT-001", 8L);
        verify(repository).existsByIpIgnoreCaseAndIdNot("10.0.0.50", 8L);
    }

    @Test
    void create_withUnknownModeloImpresoraId_throwsResourceNotFoundException() {
        when(modeloImpresoraRepository.findById(99L)).thenReturn(Optional.empty());

        ImpresoraRequest request = sampleRequest();
        request.setModeloImpresoraId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_removesExistingImpresora() {
        Impresora impresora = sampleImpresora(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(impresora));

        service.delete(1L);

        verify(intervencionService).eliminarTodasDeImpresora(1L);
        verify(repository).delete(impresora);
    }

    @Test
    void create_withTipoConexionUsb_forcesIpNull() {
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
        ImpresoraRequest request = sampleRequest();
        request.setTipoConexion("USB");
        request.setIp("10.0.0.50");
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(request);

        assertThat(result.getTipoConexion()).isEqualTo("USB");
        assertThat(result.getIp()).isNull();
    }

    @Test
    void create_withTipoConexionIp_preservesIp() {
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(sampleRequest());

        assertThat(result.getTipoConexion()).isEqualTo("IP");
        assertThat(result.getIp()).isEqualTo("10.0.0.50");
    }

    @Test
    void create_resolvesTipoImpresoraFromId() {
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
        ImpresoraRequest request = sampleRequest();
        request.setTipoImpresoraId(5L);
        TipoImpresora tipo = new TipoImpresora();
        tipo.setId(5L);
        tipo.setNombre("Láser");
        when(tipoImpresoraRepository.findById(5L)).thenReturn(Optional.of(tipo));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(request);

        assertThat(result.getTipoImpresora()).isNotNull();
        assertThat(result.getTipoImpresora().getNombre()).isEqualTo("Láser");
    }

    @Test
    void getDashboardCompleto_aggregatesCountsDistributionAndConsumibles() {
        com.inia.soportedesk.catalogo.MarcaImpresora canon = new com.inia.soportedesk.catalogo.MarcaImpresora();
        canon.setId(2L);
        canon.setNombre("Canon");

        ModeloImpresora modeloHp = modeloImpresora();
        modeloHp.setToners(List.of(toner(modeloHp, "Negro", "Estandar", "TN-2380")));

        ModeloImpresora modeloCanon = new ModeloImpresora();
        modeloCanon.setId(2L);
        modeloCanon.setMarca(canon);
        modeloCanon.setNombre("LBP2900");
        modeloCanon.setToners(List.of(toner(modeloCanon, "Negro", "Estandar", "TN-2380")));

        com.inia.soportedesk.catalogo.Sede central = new com.inia.soportedesk.catalogo.Sede();
        central.setId(1L);
        central.setNombre("Sede Central");

        com.inia.soportedesk.catalogo.Dependencia oti = new com.inia.soportedesk.catalogo.Dependencia();
        oti.setId(1L);
        oti.setNombre("OTI");
        com.inia.soportedesk.catalogo.Subdependencia soporte = new com.inia.soportedesk.catalogo.Subdependencia();
        soporte.setId(1L);
        soporte.setNombre("Soporte");

        Impresora activa1 = sampleImpresora(1L);
        activa1.setModeloImpresora(modeloHp);
        activa1.setSede(central);
        activa1.setDependencia(oti);
        activa1.setSubdependencia(soporte);
        activa1.setEstado("Activa");

        Impresora activa2 = sampleImpresora(2L);
        activa2.setModeloImpresora(modeloCanon);
        activa2.setSede(central);
        activa2.setDependencia(oti);
        activa2.setSubdependencia(soporte);
        activa2.setEstado("Activa");

        Impresora mantenimiento = sampleImpresora(3L);
        mantenimiento.setModeloImpresora(modeloHp);
        mantenimiento.setSede(null);
        mantenimiento.setEstado("En mantenimiento");

        Impresora deBaja = sampleImpresora(4L);
        deBaja.setModeloImpresora(modeloHp);
        deBaja.setSede(central);
        deBaja.setEstado("De baja");

        when(repository.findAll()).thenReturn(List.of(activa1, activa2, mantenimiento, deBaja));

        ImpresoraDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.total()).isEqualTo(4);
        assertThat(result.activas()).isEqualTo(2);
        assertThat(result.enMantenimiento()).isEqualTo(1);
        assertThat(result.deBaja()).isEqualTo(1);

        assertThat(result.distribucionPorMarca())
                .extracting(ImpresoraMarcaCount::marca, ImpresoraMarcaCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("HP", 3L),
                        org.assertj.core.groups.Tuple.tuple("Canon", 1L)
                );

        assertThat(result.distribucionPorDependencia())
                .extracting(ImpresoraDependenciaCount::dependencia, ImpresoraDependenciaCount::total)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("OTI", 2L),
                        org.assertj.core.groups.Tuple.tuple("Sin dependencia", 2L)
                );
        assertThat(result.distribucionPorSubdependencia())
                .extracting(ImpresoraSubdependenciaCount::subdependencia, ImpresoraSubdependenciaCount::total)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Sin subdependencia", 2L),
                        org.assertj.core.groups.Tuple.tuple("Soporte", 2L)
                );

        assertThat(result.distribucionPorSede())
                .extracting(ImpresoraSedeCount::sede, ImpresoraSedeCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("Sede Central", 3L),
                        org.assertj.core.groups.Tuple.tuple("Sin sede", 1L)
                );

        assertThat(result.totalConsumiblesDistintos()).isEqualTo(1);
        assertThat(result.topConsumibles()).hasSize(1);
        assertThat(result.topConsumibles().get(0).cantidad()).isEqualTo(4);
        assertThat(result.topConsumibles().get(0).codigo()).isEqualTo("TN-2380");
    }

    @Test
    void getDashboardCompleto_onException_returnsEmptyDashboard() {
        when(repository.findAll()).thenThrow(new RuntimeException("db down"));

        ImpresoraDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.total()).isEqualTo(0);
        assertThat(result.distribucionPorMarca()).isEmpty();
        assertThat(result.distribucionPorDependencia()).isEmpty();
        assertThat(result.distribucionPorSubdependencia()).isEmpty();
        assertThat(result.topConsumibles()).isEmpty();
    }

    private com.inia.soportedesk.catalogo.ModeloImpresoraToner toner(ModeloImpresora modelo, String color, String variante, String codigo) {
        com.inia.soportedesk.catalogo.ModeloImpresoraToner t = new com.inia.soportedesk.catalogo.ModeloImpresoraToner();
        t.setModeloImpresora(modelo);
        t.setColor(color);
        t.setVariante(variante);
        t.setCodigo(codigo);
        return t;
    }
}
