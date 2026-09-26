package com.inia.soportedesk.herramientas.monitoreo;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonitorPingRecorderTest {

    @Mock
    private MonitorPingRepository monitorRepository;
    @Mock
    private MonitorPingMuestraRepository muestraRepository;
    @Mock
    private MonitorPingResumenHoraRepository resumenRepository;
    @Mock
    private MonitorPingEventService eventService;

    @Test
    void registrar_persisteMuestraActualizaResumenYPublicaEvento() {
        MonitorPing monitor = new MonitorPing();
        monitor.setId(9L);
        monitor.setNombre("Gateway");
        monitor.setHost("10.0.0.1");
        monitor.setEstado(MonitorPingEstado.ACTIVO);
        monitor.setTotalMuestras(4L);
        monitor.setTotalFallidas(1L);
        when(monitorRepository.findById(9L)).thenReturn(Optional.of(monitor));
        when(resumenRepository.findByMonitorIdAndHora(any(), any())).thenReturn(Optional.empty());

        MonitorPingRecorder recorder = new MonitorPingRecorder(
                monitorRepository, muestraRepository, resumenRepository, eventService);
        Instant fecha = Instant.parse("2026-08-28T15:20:10Z");
        recorder.registrar(9L, fecha, true, 24.0);

        ArgumentCaptor<MonitorPingMuestra> muestra = ArgumentCaptor.forClass(MonitorPingMuestra.class);
        verify(muestraRepository).save(muestra.capture());
        assertThat(muestra.getValue().getLatenciaMs()).isEqualTo(24.0);
        assertThat(monitor.getTotalMuestras()).isEqualTo(5L);
        assertThat(monitor.getUltimaDisponible()).isTrue();
        verify(resumenRepository).save(any(MonitorPingResumenHora.class));

        ArgumentCaptor<MonitorPingEventResponse> event = ArgumentCaptor.forClass(MonitorPingEventResponse.class);
        verify(eventService).publish(event.capture());
        assertThat(event.getValue().monitorId()).isEqualTo(9L);
        assertThat(event.getValue().totalMuestras()).isEqualTo(5L);
        assertThat(event.getValue().salud()).isEqualTo("DISPONIBLE");
    }
}
