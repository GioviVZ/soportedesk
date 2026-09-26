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
class DependenciaServiceTest {

    @Mock
    private DependenciaRepository repository;

    @Mock
    private SedeRepository sedeRepository;

    @InjectMocks
    private DependenciaService service;

    @Test
    void findAll_withSedeIdOnly_usesFindBySedeId() {
        when(repository.findBySedeId(1L)).thenReturn(List.of(new Dependencia(1L, "TI", new Sede(1L, "Lima"))));

        List<Dependencia> result = service.findAll(1L, null);

        assertThat(result).hasSize(1);
        verify(repository).findBySedeId(1L);
    }

    @Test
    void findAll_withoutFilters_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Dependencia(1L, "TI", new Sede(1L, "Lima"))));

        List<Dependencia> result = service.findAll(null, null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void create_resolvesSedeAndSaves() {
        Sede sede = new Sede(1L, "Lima");
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sede));
        when(repository.save(any(Dependencia.class))).thenAnswer(inv -> inv.getArgument(0));

        DependenciaRequest request = new DependenciaRequest();
        request.setNombre("TI");
        request.setSedeId(1L);

        Dependencia result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("TI");
        assertThat(result.getSede()).isEqualTo(sede);
    }

    @Test
    void create_withUnknownSedeId_throwsResourceNotFoundException() {
        when(sedeRepository.findById(99L)).thenReturn(Optional.empty());

        DependenciaRequest request = new DependenciaRequest();
        request.setNombre("TI");
        request.setSedeId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
