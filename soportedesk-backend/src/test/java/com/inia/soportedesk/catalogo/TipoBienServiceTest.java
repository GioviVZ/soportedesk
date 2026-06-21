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
class TipoBienServiceTest {

    @Mock
    private TipoBienRepository repository;

    @InjectMocks
    private TipoBienService service;

    private TipoBien sample() {
        TipoBien tipo = new TipoBien();
        tipo.setId(1L);
        tipo.setNombre("Intangible");
        return tipo;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(sample()));

        List<TipoBien> result = service.findAll(null);

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
    void create_savesTipoBienFromRequest() {
        TipoBienRequest request = new TipoBienRequest();
        request.setNombre("Intangible");
        when(repository.save(any(TipoBien.class))).thenAnswer(inv -> inv.getArgument(0));

        TipoBien result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("Intangible");
    }
}
