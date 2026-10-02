package com.inia.soportedesk.equiposmoviles;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
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
class EquipoMovilServiceTest {

    @Mock
    private EquipoMovilRepository repository;
    @Mock
    private AsignacionNumeroMovilRepository asignacionRepository;
    @Mock
    private ActaMovilRepository actaRepository;
    @Mock
    private SedeRepository sedeRepository;
    @Mock
    private DependenciaRepository dependenciaRepository;
    @Mock
    private SubdependenciaRepository subdependenciaRepository;

    @InjectMocks
    private EquipoMovilService service;

    @Test
    void create_acceptsValidLuhnImeiAndNormalizesFields() {
        EquipoMovilRequest request = sampleRequest();
        request.setImei1("490154203237518");
        request.setMac("a4-6c-2a-18-9f-01");
        when(repository.save(any(EquipoMovil.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EquipoMovil result = service.create(request);

        assertThat(result.getImei1()).isEqualTo("490154203237518");
        assertThat(result.getMarca()).isEqualTo("Samsung");
        assertThat(result.getMac()).isEqualTo("A4:6C:2A:18:9F:01");
    }

    @Test
    void create_rejectsInvalidLuhnImei() {
        EquipoMovilRequest request = sampleRequest();
        request.setImei1("490154203237519");

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El IMEI 490154203237519 no es válido");
    }

    @Test
    void create_rejectsImeiAlreadyStoredInEitherImeiColumn() {
        EquipoMovilRequest request = sampleRequest();
        request.setImei1("490154203237518");
        when(repository.existsImeiOnOtherEquipo("490154203237518", null)).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Ya existe un equipo móvil con el IMEI 490154203237518.");
    }

    @Test
    void delete_isBlockedWhenEquipoHasAsignaciones() {
        EquipoMovil equipo = equipo(7L, "Operativo");
        when(repository.findById(7L)).thenReturn(Optional.of(equipo));
        when(asignacionRepository.existsByEquipoMovilId(7L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(7L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("No se puede eliminar: el equipo tiene asignaciones o actas registradas.");
    }

    @Test
    void resumen_countsDevicesWithoutActiveAssignment() {
        EquipoMovil operativoAsignado = equipo(1L, "Operativo");
        EquipoMovil operativoLibre = equipo(2L, "Operativo");
        EquipoMovil revisionLibre = equipo(3L, "En revisión");
        when(repository.findAllByOrderByIdDesc())
                .thenReturn(List.of(operativoAsignado, operativoLibre, revisionLibre));
        when(asignacionRepository.existsByEquipoMovilIdAndEstado(1L, "Activa")).thenReturn(true);

        EquipoMovilResumen result = service.resumen();

        assertThat(result).isEqualTo(new EquipoMovilResumen(3, 2, 1, 2));
        verify(asignacionRepository).existsByEquipoMovilIdAndEstado(3L, "Activa");
    }

    private EquipoMovilRequest sampleRequest() {
        EquipoMovilRequest request = new EquipoMovilRequest();
        request.setTipo(TipoEquipoMovil.SMARTPHONE);
        request.setMarca(" Samsung ");
        request.setModelo(" Galaxy S24 ");
        request.setEstado("Operativo");
        return request;
    }

    private EquipoMovil equipo(Long id, String estado) {
        EquipoMovil equipo = new EquipoMovil();
        equipo.setId(id);
        equipo.setTipo(TipoEquipoMovil.SMARTPHONE);
        equipo.setMarca("Samsung");
        equipo.setModelo("Galaxy");
        equipo.setEstado(estado);
        return equipo;
    }
}
