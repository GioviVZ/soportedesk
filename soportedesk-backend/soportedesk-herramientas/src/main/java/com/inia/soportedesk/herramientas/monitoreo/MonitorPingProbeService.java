package com.inia.soportedesk.herramientas.monitoreo;

import com.inia.soportedesk.herramientas.HerramientasService;
import com.inia.soportedesk.herramientas.PingResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class MonitorPingProbeService {

    private final MonitorPingRepository repository;
    private final HerramientasService herramientasService;
    private final MonitorPingRecorder recorder;

    public void ejecutar(Long monitorId) {
        MonitorPing monitor = repository.findById(monitorId).orElse(null);
        if (monitor == null || monitor.getEstado() != MonitorPingEstado.ACTIVO) {
            return;
        }

        try {
            PingResult result = herramientasService.ping(monitor.getHost(), 1);
            recorder.registrar(
                    monitorId,
                    Instant.now(),
                    result.isReachable(),
                    result.getAverageLatencyMs()
            );
        } catch (RuntimeException error) {
            recorder.registrar(monitorId, Instant.now(), false, null);
        }
    }
}
