package com.inia.soportedesk.usuariosred;

import com.inia.soportedesk.catalogo.*;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioRedServiceTest {

    @Mock
    private UsuarioRedRepository repository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private DependenciaRepository dependenciaRepository;

    @Mock
    private SubdependenciaRepository subdependenciaRepository;

    @Mock
    private TipoContratoRepository tipoContratoRepository;

    @InjectMocks
    private UsuarioRedService service;

    private final Sede sede = new Sede(1L, "Lima");
    private final Dependencia dependencia = new Dependencia(1L, "TI", sede);
    private final Subdependencia subdependencia = new Subdependencia(1L, "Soporte", dependencia);
    private final TipoContrato tipoContrato = new TipoContrato(1L, "CAS");

    private UsuarioRedRequest sampleRequest() {
        UsuarioRedRequest request = new UsuarioRedRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setGrupo("IT-Admins");
        request.setUltimoLogin(LocalDateTime.of(2025, 6, 13, 8, 42));
        request.setEstado("Activo");
        request.setSedeId(1L);
        request.setDependenciaId(1L);
        request.setSubdependenciaId(1L);
        request.setTipoContratoId(1L);
        request.setFechaFinContrato(LocalDate.of(2026, 12, 31));
        return request;
    }

    private void stubCatalogLookups() {
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sede));
        when(dependenciaRepository.findById(1L)).thenReturn(Optional.of(dependencia));
        when(subdependenciaRepository.findById(1L)).thenReturn(Optional.of(subdependencia));
        when(tipoContratoRepository.findById(1L)).thenReturn(Optional.of(tipoContrato));
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        UsuarioRed usuario = new UsuarioRed(1L, "jperez", "Juan Pérez", "IT-Admins", LocalDateTime.of(2025, 6, 13, 8, 42), "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31));
        when(repository.findAll()).thenReturn(List.of(usuario));

        List<UsuarioRed> result = service.findAll(null);

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
    void create_resolvesCatalogsAndSaves() {
        stubCatalogLookups();
        when(repository.save(any(UsuarioRed.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioRed result = service.create(sampleRequest());

        assertThat(result.getUsuario()).isEqualTo("jperez");
        assertThat(result.getSede()).isEqualTo(sede);
        assertThat(result.getDependencia()).isEqualTo(dependencia);
        assertThat(result.getSubdependencia()).isEqualTo(subdependencia);
        assertThat(result.getTipoContrato()).isEqualTo(tipoContrato);
    }

    @Test
    void delete_removesExistingUsuarioRed() {
        UsuarioRed usuario = new UsuarioRed(1L, "jperez", "Juan Pérez", "IT-Admins", LocalDateTime.of(2025, 6, 13, 8, 42), "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31));
        when(repository.findById(1L)).thenReturn(Optional.of(usuario));

        service.delete(1L);

        verify(repository).delete(usuario);
    }
}
