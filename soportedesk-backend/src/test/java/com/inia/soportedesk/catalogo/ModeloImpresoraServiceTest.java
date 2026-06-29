package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModeloImpresoraServiceTest {

    @Mock
    private ModeloImpresoraRepository repository;

    @Mock
    private MarcaImpresoraRepository marcaImpresoraRepository;

    @InjectMocks
    private ModeloImpresoraService service;

    private MarcaImpresora marca() {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");
        return marca;
    }

    private ModeloImpresoraRequest sampleRequest() {
        ModeloImpresoraRequest request = new ModeloImpresoraRequest();
        request.setMarcaId(1L);
        request.setNombre("M404dn");
        ModeloImpresoraRequest.TonerRequest toner = new ModeloImpresoraRequest.TonerRequest();
        toner.setColor("Negro");
        toner.setVariante("Estándar");
        toner.setCodigo("CF259A");
        request.setToners(new ArrayList<>(List.of(toner)));
        return request;
    }

    @Test
    void findAll_withoutFilters_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new ModeloImpresora()));

        List<ModeloImpresora> result = service.findAll(null, null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findAll_withMarcaId_usesFindByMarcaId() {
        when(repository.findByMarcaId(1L)).thenReturn(List.of(new ModeloImpresora()));

        List<ModeloImpresora> result = service.findAll(1L, null);

        assertThat(result).hasSize(1);
        verify(repository).findByMarcaId(1L);
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesModeloImpresoraWithToners() {
        when(marcaImpresoraRepository.findById(1L)).thenReturn(Optional.of(marca()));
        when(repository.save(any(ModeloImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ModeloImpresora result = service.create(sampleRequest());

        assertThat(result.getNombre()).isEqualTo("M404dn");
        assertThat(result.getMarca().getNombre()).isEqualTo("HP");
        assertThat(result.getToners()).hasSize(1);
        assertThat(result.getToners().get(0).getCodigo()).isEqualTo("CF259A");
    }

    @Test
    void create_withUnknownMarcaId_throwsResourceNotFoundException() {
        when(marcaImpresoraRepository.findById(99L)).thenReturn(Optional.empty());

        ModeloImpresoraRequest request = sampleRequest();
        request.setMarcaId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_withPartiallyFilledToner_throwsIllegalArgumentException() {
        when(marcaImpresoraRepository.findById(1L)).thenReturn(Optional.of(marca()));

        ModeloImpresoraRequest request = sampleRequest();
        request.getToners().get(0).setCodigo(null);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_withoutToners_succeeds() {
        when(marcaImpresoraRepository.findById(1L)).thenReturn(Optional.of(marca()));
        when(repository.save(any(ModeloImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ModeloImpresoraRequest request = sampleRequest();
        request.setToners(new ArrayList<>());

        ModeloImpresora result = service.create(request);

        assertThat(result.getToners()).isEmpty();
    }

    @Test
    void update_replacesExistingToners() {
        ModeloImpresora existing = new ModeloImpresora();
        existing.setId(1L);
        existing.setMarca(marca());
        existing.setNombre("M404dn");
        ModeloImpresoraToner oldToner = new ModeloImpresoraToner();
        oldToner.setModeloImpresora(existing);
        oldToner.setColor("Negro");
        oldToner.setVariante("Estándar");
        oldToner.setCodigo("OLD-CODE");
        existing.getToners().add(oldToner);

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(marcaImpresoraRepository.findById(1L)).thenReturn(Optional.of(marca()));
        when(repository.save(any(ModeloImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ModeloImpresora result = service.update(1L, sampleRequest());

        assertThat(result.getToners()).hasSize(1);
        assertThat(result.getToners().get(0).getCodigo()).isEqualTo("CF259A");
    }

    @Test
    void delete_removesExistingModeloImpresora() {
        ModeloImpresora existing = new ModeloImpresora();
        existing.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }

    @Test
    void updateDriver_setsDriverFieldsAndSaves() {
        ModeloImpresora existing = new ModeloImpresora();
        existing.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(ModeloImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ModeloImpresora result = service.updateDriver(1L, "driver-hp.zip", "1.2", "Windows 10", "1/driver-hp.zip");

        assertThat(result.getDriverNombre()).isEqualTo("driver-hp.zip");
        assertThat(result.getDriverVersion()).isEqualTo("1.2");
        assertThat(result.getDriverSo()).isEqualTo("Windows 10");
        assertThat(result.getDriverArchivoPath()).isEqualTo("1/driver-hp.zip");
        verify(repository).save(existing);
    }
}
