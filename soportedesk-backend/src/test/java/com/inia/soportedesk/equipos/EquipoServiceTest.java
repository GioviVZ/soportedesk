package com.inia.soportedesk.equipos;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
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

    @Mock
    private UsuarioRedRepository usuarioRedRepository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private DependenciaRepository dependenciaRepository;

    @Mock
    private SubdependenciaRepository subdependenciaRepository;

    @InjectMocks
    private EquipoService service;

    private EquipoRequest sampleRequest() {
        EquipoRequest request = new EquipoRequest();
        request.setNumeroSerie("SN-2024-001");
        request.setTipo("Laptop");
        request.setMarca("Dell");
        request.setModelo("Latitude 5540");
        request.setAsignado(LocalDate.of(2024, 1, 10));
        request.setEstado("En uso");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        Equipo equipo = new Equipo();
        equipo.setNumeroSerie("SN-2024-001");
        when(repository.findAll()).thenReturn(List.of(equipo));

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

        assertThat(result.getNumeroSerie()).isEqualTo("SN-2024-001");
        assertThat(result.getMarca()).isEqualTo("Dell");
    }

    @Test
    void delete_removesExistingEquipo() {
        Equipo existing = new Equipo();
        existing.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
