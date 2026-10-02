package com.inia.soportedesk.telefoniafija;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AsignacionAnexoServiceTest {

    @Mock
    private AsignacionAnexoRepository repository;
    @Mock
    private TelefonoFijoRepository telefonoRepository;
    @Mock
    private DependenciaRepository dependenciaRepository;

    @InjectMocks
    private AsignacionAnexoService service;

    @Test
    void create_rejectsInvalidAnexoFormat() {
        AsignacionAnexoRequest request = sampleRequest();
        request.setAnexo("12A");

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El anexo debe tener entre 3 y 6 dígitos");
    }

    @Test
    void create_rejectsDuplicateActiveAnexo() {
        AsignacionAnexoRequest request = sampleRequest();
        when(telefonoRepository.existsById(1L)).thenReturn(true);
        when(repository.existsActiveAnexo("1234", null)).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El anexo 1234 ya tiene una asignación activa.");
    }

    @Test
    void create_allowsAnexoWhenExistingAssignmentIsFinalizada() {
        AsignacionAnexoRequest request = sampleRequest();
        TelefonoFijo telefono = telefono(1L, new Sede(10L, "Central"));
        when(telefonoRepository.existsById(1L)).thenReturn(true);
        when(telefonoRepository.findById(1L)).thenReturn(Optional.of(telefono));
        when(repository.existsActiveAnexo("1234", null)).thenReturn(false);
        when(repository.save(any(AsignacionAnexo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AsignacionAnexo result = service.create(request);

        assertThat(result.getAnexo()).isEqualTo("1234");
        assertThat(result.getEstado()).isEqualTo("Activa");
        verify(repository).existsActiveAnexo("1234", null);
    }

    @Test
    void create_rejectsDuplicateActiveNumeroDirecto() {
        AsignacionAnexoRequest request = sampleRequest();
        request.setNumeroDirecto("4201234");
        when(telefonoRepository.existsById(1L)).thenReturn(true);
        when(repository.existsActiveNumeroDirecto("4201234", null)).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El número directo 4201234 ya tiene una asignación activa.");
    }

    @Test
    void create_rejectsFinalizadaWithoutFechaFin() {
        AsignacionAnexoRequest request = sampleRequest();
        request.setEstado("Finalizada");

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Una asignación finalizada debe tener fecha de fin.");
        verify(telefonoRepository, never()).existsById(any());
    }

    @Test
    void resumen_countsDistinctSitesAmongActiveAssignments() {
        Sede central = new Sede(10L, "Central");
        Sede norte = new Sede(20L, "Norte");
        when(repository.search("", null, null)).thenReturn(List.of(
                asignacion("Activa", telefono(1L, central)),
                asignacion("Activa", telefono(2L, central)),
                asignacion("Activa", telefono(3L, norte)),
                asignacion("Finalizada", telefono(4L, new Sede(30L, "Sur")))));

        AsignacionAnexoResumen result = service.resumen();

        assertThat(result).isEqualTo(new AsignacionAnexoResumen(4, 3, 1, 2));
    }

    private AsignacionAnexoRequest sampleRequest() {
        AsignacionAnexoRequest request = new AsignacionAnexoRequest();
        request.setTelefonoFijoId(1L);
        request.setAnexo("1234");
        request.setPersonaNombre("María Pérez");
        request.setFechaInicio(LocalDate.of(2026, 1, 10));
        request.setEstado("Activa");
        return request;
    }

    private TelefonoFijo telefono(Long id, Sede sede) {
        TelefonoFijo telefono = new TelefonoFijo();
        telefono.setId(id);
        telefono.setTipo(TipoTelefonoFijo.IP);
        telefono.setMarca("Cisco");
        telefono.setModelo("CP-8841");
        telefono.setEstado("Operativo");
        telefono.setSede(sede);
        return telefono;
    }

    private AsignacionAnexo asignacion(String estado, TelefonoFijo telefono) {
        AsignacionAnexo asignacion = new AsignacionAnexo();
        asignacion.setTelefonoFijo(telefono);
        asignacion.setAnexo("1234");
        asignacion.setPersonaNombre("María Pérez");
        asignacion.setFechaInicio(LocalDate.of(2026, 1, 10));
        asignacion.setEstado(estado);
        return asignacion;
    }
}
