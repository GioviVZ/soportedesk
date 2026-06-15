package com.inia.soportedesk.equipos;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoServiceTest {

    @Mock
    private EquipoRepository repository;

    @InjectMocks
    private EquipoService service;

    private EquipoRequest sampleRequest() {
        EquipoRequest request = new EquipoRequest();
        request.setCodigo("EQ-2024-001");
        request.setTipo("Laptop");
        request.setMarca("Dell");
        request.setModelo("Latitude 5540");
        request.setUsuario("jperez");
        request.setArea("TI");
        request.setAsignado(LocalDate.of(2024, 1, 10));
        request.setEstado("En uso");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Equipo(1L, "EQ-2024-001", "Laptop", "Dell", "Latitude 5540", "jperez", "TI", LocalDate.of(2024, 1, 10), "En uso")));

        List<Equipo> result = service.findAll(null);

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
    void create_savesEquipoFromRequest() {
        when(repository.save(any(Equipo.class))).thenAnswer(inv -> inv.getArgument(0));

        Equipo result = service.create(sampleRequest());

        assertThat(result.getCodigo()).isEqualTo("EQ-2024-001");
    }

    @Test
    void delete_removesExistingEquipo() {
        Equipo existing = new Equipo(1L, "EQ-2024-001", "Laptop", "Dell", "Latitude 5540", "jperez", "TI", LocalDate.of(2024, 1, 10), "En uso");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
