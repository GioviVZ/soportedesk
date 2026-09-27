package com.inia.soportedesk.catalogo;

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
class MarcaImpresoraServiceTest {

    @Mock
    private MarcaImpresoraRepository repository;

    @InjectMocks
    private MarcaImpresoraService service;

    private MarcaImpresora sample() {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");
        return marca;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(sample()));

        List<MarcaImpresora> result = service.findAll(null);

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
    void create_savesMarcaImpresoraFromRequest() {
        MarcaImpresoraRequest request = new MarcaImpresoraRequest();
        request.setNombre("HP");
        when(repository.save(any(MarcaImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        MarcaImpresora result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("HP");
    }
    @Test
    void create_withDuplicatedName_rejectsBrand() {
        MarcaImpresoraRequest request = new MarcaImpresoraRequest();
        request.setNombre(" hp ");
        when(repository.existsByNombreIgnoreCase("hp")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("marca de impresora hp");
    }
}
