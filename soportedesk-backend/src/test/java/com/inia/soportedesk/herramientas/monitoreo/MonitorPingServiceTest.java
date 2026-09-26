package com.inia.soportedesk.herramientas.monitoreo;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonitorPingServiceTest {

    @Mock
    private MonitorPingRepository repository;

    @Test
    void crear_guardaMonitorActivoConPrimeraMedicionPendiente() {
        MonitorPingService service = new MonitorPingService(repository);
        MonitorPingRequest request = request("Servidor AD", "10.10.1.20", 10);
        when(repository.existsByNombreIgnoreCase("Servidor AD")).thenReturn(false);
        when(repository.countByEstado(MonitorPingEstado.ACTIVO)).thenReturn(3L);
        when(repository.save(any(MonitorPing.class))).thenAnswer(invocation -> {
            MonitorPing monitor = invocation.getArgument(0);
            monitor.setId(12L);
            return monitor;
        });

        MonitorPingResponse response = service.crear(request, "maria");

        ArgumentCaptor<MonitorPing> saved = ArgumentCaptor.forClass(MonitorPing.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getEstado()).isEqualTo(MonitorPingEstado.ACTIVO);
        assertThat(saved.getValue().getProximaMedicion()).isNotNull();
        assertThat(saved.getValue().getCreadoPor()).isEqualTo("maria");
        assertThat(response.id()).isEqualTo(12L);
        assertThat(response.salud()).isEqualTo("PENDIENTE");
    }

    @Test
    void pausar_conservaMonitorYDetieneProgramacion() {
        MonitorPingService service = new MonitorPingService(repository);
        MonitorPing monitor = monitor(5L, MonitorPingEstado.ACTIVO);
        when(repository.findById(5L)).thenReturn(Optional.of(monitor));
        when(repository.save(monitor)).thenReturn(monitor);

        MonitorPingResponse response = service.pausar(5L);

        assertThat(response.estado()).isEqualTo(MonitorPingEstado.PAUSADO);
        assertThat(monitor.getProximaMedicion()).isNull();
    }

    @Test
    void crear_rechazaNombreDuplicado() {
        MonitorPingService service = new MonitorPingService(repository);
        when(repository.existsByNombreIgnoreCase("Servidor AD")).thenReturn(true);

        assertThatThrownBy(() -> service.crear(request("Servidor AD", "10.10.1.20", 10), "maria"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Ya existe");
    }

    private MonitorPingRequest request(String nombre, String host, int intervalo) {
        MonitorPingRequest request = new MonitorPingRequest();
        request.setNombre(nombre);
        request.setHost(host);
        request.setIntervaloSegundos(intervalo);
        return request;
    }

    private MonitorPing monitor(Long id, MonitorPingEstado estado) {
        MonitorPing monitor = new MonitorPing();
        monitor.setId(id);
        monitor.setNombre("Servidor AD");
        monitor.setHost("10.10.1.20");
        monitor.setIntervaloSegundos(10);
        monitor.setEstado(estado);
        monitor.setCreadoPor("admin");
        return monitor;
    }
}
