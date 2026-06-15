package com.inia.soportedesk.licencias;

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
class LicenciaServiceTest {

    @Mock
    private LicenciaRepository repository;

    @InjectMocks
    private LicenciaService service;

    private LicenciaRequest sampleRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setCantidad(5);
        request.setLicencia("Office 365 E3");
        request.setCorreo("j.perez@inia.gob.pe");
        request.setClave("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024")));

        List<Licencia> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findAll_withSearch_usesSearchQuery() {
        when(repository.search("office")).thenReturn(List.of(new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024")));

        List<Licencia> result = service.findAll("office");

        assertThat(result).hasSize(1);
        verify(repository).search("office");
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesLicenciaFromRequest() {
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        Licencia result = service.create(sampleRequest());

        assertThat(result.getLicencia()).isEqualTo("Office 365 E3");
        assertThat(result.getCantidad()).isEqualTo(5);
    }

    @Test
    void update_modifiesExistingLicencia() {
        Licencia existing = new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        LicenciaRequest request = sampleRequest();
        request.setCantidad(10);

        Licencia result = service.update(1L, request);

        assertThat(result.getCantidad()).isEqualTo(10);
    }

    @Test
    void delete_removesExistingLicencia() {
        Licencia existing = new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
