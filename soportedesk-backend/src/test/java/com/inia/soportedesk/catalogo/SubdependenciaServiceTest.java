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
class SubdependenciaServiceTest {

    @Mock
    private SubdependenciaRepository repository;

    @Mock
    private DependenciaRepository dependenciaRepository;

    @InjectMocks
    private SubdependenciaService service;

    @Test
    void findAll_withDependenciaIdOnly_usesFindByDependenciaId() {
        Dependencia dependencia = new Dependencia(1L, "TI", new Sede(1L, "Lima"));
        when(repository.findByDependenciaId(1L)).thenReturn(List.of(new Subdependencia(1L, "Soporte", dependencia)));

        List<Subdependencia> result = service.findAll(1L, null);

        assertThat(result).hasSize(1);
        verify(repository).findByDependenciaId(1L);
    }

    @Test
    void create_resolvesDependenciaAndSaves() {
        Dependencia dependencia = new Dependencia(1L, "TI", new Sede(1L, "Lima"));
        when(dependenciaRepository.findById(1L)).thenReturn(Optional.of(dependencia));
        when(repository.save(any(Subdependencia.class))).thenAnswer(inv -> inv.getArgument(0));

        SubdependenciaRequest request = new SubdependenciaRequest();
        request.setNombre("Soporte");
        request.setDependenciaId(1L);

        Subdependencia result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("Soporte");
        assertThat(result.getDependencia()).isEqualTo(dependencia);
    }

    @Test
    void create_withUnknownDependenciaId_throwsResourceNotFoundException() {
        when(dependenciaRepository.findById(99L)).thenReturn(Optional.empty());

        SubdependenciaRequest request = new SubdependenciaRequest();
        request.setNombre("Soporte");
        request.setDependenciaId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
