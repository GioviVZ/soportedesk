package com.inia.soportedesk.herramientas.monitoreo;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MonitorPingScheduler {

    private final MonitorPingRepository repository;
    private final MonitorPingProbeService probeService;
    private ThreadPoolTaskExecutor executor;

    @Value("${monitoreo-ping.max-concurrentes:10}")
    private int maxConcurrentes;

    @PostConstruct
    void iniciarExecutor() {
        executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(Math.max(1, maxConcurrentes));
        executor.setMaxPoolSize(Math.max(1, maxConcurrentes));
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("monitor-ping-");
        executor.setWaitForTasksToCompleteOnShutdown(false);
        executor.initialize();
    }

    @PreDestroy
    void detenerExecutor() {
        if (executor != null) {
            executor.shutdown();
        }
    }

    @Scheduled(fixedDelayString = "${monitoreo-ping.despacho-ms:1000}")
    public void despachar() {
        Instant ahora = Instant.now();
        List<MonitorPing> pendientes = repository.findPendientes(
                MonitorPingEstado.ACTIVO,
                ahora,
                PageRequest.of(0, 100)
        );

        for (MonitorPing monitor : pendientes) {
            Instant siguiente = ahora.plusSeconds(monitor.getIntervaloSegundos());
            if (repository.reclamar(monitor.getId(), MonitorPingEstado.ACTIVO, ahora, siguiente) != 1) {
                continue;
            }
            try {
                executor.execute(() -> probeService.ejecutar(monitor.getId()));
            } catch (TaskRejectedException ignored) {
                // El monitor vuelve a quedar elegible al cumplirse su siguiente intervalo.
            }
        }
    }
}
