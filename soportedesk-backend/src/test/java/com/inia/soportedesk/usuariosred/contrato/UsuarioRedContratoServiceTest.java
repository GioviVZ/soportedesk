package com.inia.soportedesk.usuariosred.contrato;

import com.inia.soportedesk.catalogo.TipoContrato;
import com.inia.soportedesk.catalogo.TipoContratoRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioRedContratoServiceTest {

    @Mock
    private UsuarioRedContratoRepository repository;

    @Mock
    private TipoContratoRepository tipoContratoRepository;

    @InjectMocks
    private UsuarioRedContratoService service;

    private final TipoContrato tipoContrato = new TipoContrato(1L, "OS");

    private UsuarioRedContratoRequest sampleRequest() {
        UsuarioRedContratoRequest request = new UsuarioRedContratoRequest();
        request.setUsuario("jperez");
        request.setTipoContratoId(1L);
        request.setFechaInicio(LocalDate.of(2026, 1, 1));
        request.setFechaFin(LocalDate.of(2026, 12, 31));
        request.setNumeroContrato("OS-001-2026");
        request.setPersonalNombre("Juan");
        request.setPersonalApellidos("Pérez");
        return request;
    }

    private UsuarioRedContrato sampleEntity() {
        UsuarioRedContrato contrato = new UsuarioRedContrato();
        contrato.setId(1L);
        contrato.setUsuario("jperez");
        contrato.setTipoContrato(tipoContrato);
        contrato.setFechaInicio(LocalDate.of(2026, 1, 1));
        contrato.setFechaFin(LocalDate.of(2026, 12, 31));
        contrato.setNumeroContrato("OS-001-2026");
        contrato.setPersonalNombre("Juan");
        contrato.setPersonalApellidos("Pérez");
        return contrato;
    }

    @Test
    void create_setsRegistradoPorAndFechaRegistro() {
        when(tipoContratoRepository.findById(1L)).thenReturn(Optional.of(tipoContrato));
        when(repository.save(any(UsuarioRedContrato.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioRedContratoDto result = service.create(sampleRequest(), "admin");

        assertThat(result.getUsuario()).isEqualTo("jperez");
        assertThat(result.getTipoContratoNombre()).isEqualTo("OS");
        assertThat(result.getRegistradoPor()).isEqualTo("admin");
        assertThat(result.getFechaRegistro()).isNotNull();
    }

    @Test
    void create_tipoContratoNotFound_throwsResourceNotFoundException() {
        when(tipoContratoRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(sampleRequest(), "admin"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_fechaFinBeforeFechaInicio_throwsIllegalArgumentException() {
        UsuarioRedContratoRequest request = sampleRequest();
        request.setFechaFin(LocalDate.of(2025, 1, 1));

        assertThatThrownBy(() -> service.create(request, "admin"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void update_setsActualizadoPorAndFechaActualizacion_leavesRegistradoPorUnchanged() {
        UsuarioRedContrato existing = sampleEntity();
        existing.setRegistradoPor("soporte1");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(tipoContratoRepository.findById(1L)).thenReturn(Optional.of(tipoContrato));
        when(repository.save(any(UsuarioRedContrato.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioRedContratoDto result = service.update(1L, sampleRequest(), "admin");

        assertThat(result.getActualizadoPor()).isEqualTo("admin");
        assertThat(result.getFechaActualizacion()).isNotNull();
        assertThat(result.getRegistradoPor()).isEqualTo("soporte1");
    }

    @Test
    void findByUsuario_mapsTipoContratoNombre() {
        when(repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc("jperez"))
                .thenReturn(List.of(sampleEntity()));

        List<UsuarioRedContratoDto> result = service.findByUsuario("jperez");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTipoContratoNombre()).isEqualTo("OS");
    }

    @Test
    void searchByPersonal_delegatesToRepository() {
        when(repository.searchByPersonal("Juan")).thenReturn(List.of(sampleEntity()));

        List<UsuarioRedContratoDto> result = service.searchByPersonal("Juan");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPersonalNombre()).isEqualTo("Juan");
    }

    @Test
    void delete_removesExistingContrato() {
        UsuarioRedContrato contrato = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(contrato));

        service.delete(1L);

        org.mockito.Mockito.verify(repository).delete(contrato);
    }
}
