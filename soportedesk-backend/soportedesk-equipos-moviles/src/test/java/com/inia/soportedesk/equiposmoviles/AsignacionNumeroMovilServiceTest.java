package com.inia.soportedesk.equiposmoviles;

import com.inia.soportedesk.catalogo.DependenciaRepository;
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
class AsignacionNumeroMovilServiceTest {

    @Mock
    private AsignacionNumeroMovilRepository repository;
    @Mock
    private EquipoMovilRepository equipoRepository;
    @Mock
    private DependenciaRepository dependenciaRepository;

    @InjectMocks
    private AsignacionNumeroMovilService service;

    @Test
    void create_rejectsDuplicateActiveNumero() {
        AsignacionNumeroMovilRequest request = sampleRequest();
        when(equipoRepository.existsById(1L)).thenReturn(true);
        when(repository.existsActiveNumero("987654321", null)).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El número 987654321 ya tiene una asignación activa.");
    }

    @Test
    void create_allowsNumeroWhenExistingAssignmentIsFinalizada() {
        AsignacionNumeroMovilRequest request = sampleRequest();
        EquipoMovil equipo = equipo();
        when(equipoRepository.existsById(1L)).thenReturn(true);
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(equipo));
        when(repository.existsActiveNumero("987654321", null)).thenReturn(false);
        when(repository.save(any(AsignacionNumeroMovil.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AsignacionNumeroMovil result = service.create(request);

        assertThat(result.getNumero()).isEqualTo("987654321");
        assertThat(result.getEstado()).isEqualTo("Activa");
        verify(repository).existsActiveNumero("987654321", null);
    }

    @Test
    void create_rejectsFinalizadaWithoutFechaFin() {
        AsignacionNumeroMovilRequest request = sampleRequest();
        request.setEstado("Finalizada");

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Una asignación finalizada debe tener fecha de fin.");
        verify(equipoRepository, never()).existsById(any());
    }

    @Test
    void create_rejectsFechaFinBeforeFechaInicio() {
        AsignacionNumeroMovilRequest request = sampleRequest();
        request.setFechaFin(LocalDate.of(2026, 1, 9));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("La fecha de fin no puede ser anterior a la fecha de inicio.");
    }

    @Test
    void resumen_countsDistinctOperatorsAmongActiveAssignments() {
        when(repository.search("", null, null)).thenReturn(List.of(
                asignacion("Activa", "Claro"),
                asignacion("Activa", "Claro"),
                asignacion("Activa", "Entel"),
                asignacion("Finalizada", "Bitel")));

        AsignacionNumeroMovilResumen result = service.resumen();

        assertThat(result).isEqualTo(new AsignacionNumeroMovilResumen(4, 3, 1, 2));
    }

    private AsignacionNumeroMovilRequest sampleRequest() {
        AsignacionNumeroMovilRequest request = new AsignacionNumeroMovilRequest();
        request.setEquipoMovilId(1L);
        request.setNumero("987654321");
        request.setOperador("Claro");
        request.setPersonaNombre("María Pérez");
        request.setFechaInicio(LocalDate.of(2026, 1, 10));
        request.setEstado("Activa");
        return request;
    }

    private EquipoMovil equipo() {
        EquipoMovil equipo = new EquipoMovil();
        equipo.setId(1L);
        equipo.setTipo(TipoEquipoMovil.SMARTPHONE);
        equipo.setMarca("Samsung");
        equipo.setModelo("Galaxy");
        equipo.setEstado("Operativo");
        return equipo;
    }

    private AsignacionNumeroMovil asignacion(String estado, String operador) {
        AsignacionNumeroMovil asignacion = new AsignacionNumeroMovil();
        asignacion.setEstado(estado);
        asignacion.setOperador(operador);
        return asignacion;
    }
}
