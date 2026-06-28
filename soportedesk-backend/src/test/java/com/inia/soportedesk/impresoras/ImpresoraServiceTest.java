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
    void update_preservesDriverFields() {
        Impresora existing = sampleImpresora(1L);
        existing.setDriverArchivoPath("drivers/1/driver-hp.zip");
        existing.setDriverNombre("driver-hp.zip");
        existing.setDriverVersion("1.2");
        existing.setDriverSo("Windows 10");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.update(1L, sampleRequest());

        assertThat(result.getModeloImpresora().getNombre()).isEqualTo("M404dn");
        assertThat(result.getDriverArchivoPath()).isEqualTo("drivers/1/driver-hp.zip");
    }

    @Test
    void delete_removesExistingImpresora() {
        Impresora impresora = sampleImpresora(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(impresora));

        service.delete(1L);

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
}
