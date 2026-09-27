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
class SedeServiceTest {

    @Mock
    private SedeRepository repository;

    @InjectMocks
    private SedeService service;

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Sede(1L, "Lima")));

        List<Sede> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findAll_withSearch_usesSearchQuery() {
        when(repository.search("lima")).thenReturn(List.of(new Sede(1L, "Lima")));

        List<Sede> result = service.findAll("lima");

        assertThat(result).hasSize(1);
        verify(repository).search("lima");
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesSedeFromRequest() {
        SedeRequest request = new SedeRequest();
        request.setNombre("Lima");
        when(repository.save(any(Sede.class))).thenAnswer(inv -> inv.getArgument(0));

        Sede result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("Lima");
    }

    @Test
    void delete_removesExistingSede() {
        Sede sede = new Sede(1L, "Lima");
        when(repository.findById(1L)).thenReturn(Optional.of(sede));

        service.delete(1L);

        verify(repository).delete(sede);
    }
}
