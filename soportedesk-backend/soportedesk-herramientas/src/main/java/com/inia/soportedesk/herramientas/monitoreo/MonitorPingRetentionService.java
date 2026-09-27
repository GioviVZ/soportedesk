package com.inia.soportedesk.herramientas.monitoreo;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class MonitorPingRetentionService {

    private final MonitorPingMuestraRepository muestraRepository;
    private final MonitorPingResumenHoraRepository resumenRepository;

    @Value("${monitoreo-ping.retencion-detalle-dias:7}")
    private int retencionDetalleDias;

    @Value("${monitoreo-ping.retencion-resumen-dias:365}")
    private int retencionResumenDias;

    @Scheduled(cron = "${monitoreo-ping.retencion-cron:0 15 2 * * *}")
    @Transactional
    public void limpiarHistorico() {
        Instant ahora = Instant.now();
        muestraRepository.deleteAnterioresA(ahora.minus(retencionDetalleDias, ChronoUnit.DAYS));
        resumenRepository.deleteAnterioresA(ahora.minus(retencionResumenDias, ChronoUnit.DAYS));
    }
}
