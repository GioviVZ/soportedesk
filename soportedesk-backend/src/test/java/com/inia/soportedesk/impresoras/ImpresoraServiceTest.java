package com.inia.soportedesk.impresoras;

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

    @InjectMocks
    private ImpresoraService service;

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setNombre("HP LaserJet 4ta planta");
        request.setMarca("HP");
        request.setModelo("M404dn");
        request.setIp("10.0.0.50");
        request.setPiso("4");
        request.setArea("Administración");
        request.setEstado("Activa");
        request.setTonerNegro(80);
        request.setTonerC(60);
        request.setTonerM(60);
        request.setTonerY(60);
        request.setCartucho(90);
        request.setDrum(70);
        request.setFusor(85);
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, null, null, null, null);
        when(repository.findAll()).thenReturn(List.of(impresora));

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
    void create_savesImpresora() {
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(sampleRequest());

        assertThat(result.getNombre()).isEqualTo("HP LaserJet 4ta planta");
        assertThat(result.getTonerNegro()).isEqualTo(80);
    }

    @Test
    void update_preservesDriverFields() {
        Impresora existing = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, "driver-hp.zip", "1.2", "Windows 10", "drivers/1/driver-hp.zip");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ImpresoraRequest request = sampleRequest();
        request.setTonerNegro(40);

        Impresora result = service.update(1L, request);

        assertThat(result.getTonerNegro()).isEqualTo(40);
        assertThat(result.getDriverArchivoPath()).isEqualTo("drivers/1/driver-hp.zip");
    }

    @Test
    void delete_removesExistingImpresora() {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, null, null, null, null);
        when(repository.findById(1L)).thenReturn(Optional.of(impresora));

        service.delete(1L);

        verify(repository).delete(impresora);
    }
}
