package com.inia.soportedesk.telefoniafija;

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
class TelefonoFijoServiceTest {

    @Mock
    private TelefonoFijoRepository repository;
    @Mock
    private AsignacionAnexoRepository asignacionRepository;
    @Mock
    private SedeRepository sedeRepository;
    @Mock
    private DependenciaRepository dependenciaRepository;
    @Mock
    private SubdependenciaRepository subdependenciaRepository;

    @InjectMocks
    private TelefonoFijoService service;

    @Test
    void create_rejectsInvalidIp() {
        TelefonoFijoRequest request = sampleRequest();
        request.setIp("256.10.10.1");

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("La IP no es válida");
    }

    @Test
    void create_normalizesMac() {
        TelefonoFijoRequest request = sampleRequest();
        request.setMac("a4-6c-2a-18-9f-01");
        when(repository.save(any(TelefonoFijo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TelefonoFijo result = service.create(request);

        assertThat(result.getMac()).isEqualTo("A4:6C:2A:18:9F:01");
    }

    @Test
    void create_rejectsDuplicateIp() {
        TelefonoFijoRequest request = sampleRequest();
        request.setIp("192.168.10.20");
        when(repository.existsByIpIgnoreCase("192.168.10.20")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Ya existe un teléfono fijo con la IP 192.168.10.20.");
    }

    @Test
    void delete_isBlockedWhenTelefonoHasAsignaciones() {
        TelefonoFijo telefono = telefono(7L, "Operativo");
        when(repository.findById(7L)).thenReturn(Optional.of(telefono));
        when(asignacionRepository.existsByTelefonoFijoId(7L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(7L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("No se puede eliminar: el teléfono tiene asignaciones de anexo registradas.");
    }

    @Test
    void resumen_countsPhonesWithoutActiveAssignment() {
        TelefonoFijo operativoAsignado = telefono(1L, "Operativo");
        TelefonoFijo operativoLibre = telefono(2L, "Operativo");
        TelefonoFijo revisionLibre = telefono(3L, "En revisión");
        when(repository.findAllByOrderByIdDesc())
                .thenReturn(List.of(operativoAsignado, operativoLibre, revisionLibre));
        when(asignacionRepository.existsByTelefonoFijoIdAndEstado(1L, "Activa")).thenReturn(true);

        TelefonoFijoResumen result = service.resumen();

        assertThat(result).isEqualTo(new TelefonoFijoResumen(3, 2, 1, 2));
        verify(asignacionRepository).existsByTelefonoFijoIdAndEstado(3L, "Activa");
    }

    private TelefonoFijoRequest sampleRequest() {
        TelefonoFijoRequest request = new TelefonoFijoRequest();
        request.setTipo(TipoTelefonoFijo.IP);
        request.setMarca(" Cisco ");
        request.setModelo(" CP-8841 ");
        request.setEstado("Operativo");
        return request;
    }

    private TelefonoFijo telefono(Long id, String estado) {
        TelefonoFijo telefono = new TelefonoFijo();
        telefono.setId(id);
        telefono.setTipo(TipoTelefonoFijo.IP);
        telefono.setMarca("Cisco");
        telefono.setModelo("CP-8841");
        telefono.setEstado(estado);
        return telefono;
    }
}
