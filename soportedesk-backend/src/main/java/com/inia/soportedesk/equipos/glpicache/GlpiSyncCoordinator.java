package com.inia.soportedesk.equipos.glpicache;

import com.inia.soportedesk.equipos.glpicache.dto.GlpiSyncResponse;
import com.inia.soportedesk.equipos.glpicache.dto.GlpiSyncStatus;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class GlpiSyncCoordinator {
    private static final Logger log = LoggerFactory.getLogger(GlpiSyncCoordinator.class);

    private final EquipoGlpiCacheSyncService syncService;
    private final GlpiSyncJobStatus jobStatus;
    private final ExecutorService executor;

    @Autowired
    public GlpiSyncCoordinator(EquipoGlpiCacheSyncService syncService, GlpiSyncJobStatus jobStatus) {
        this(syncService, jobStatus, Executors.newSingleThreadExecutor(GlpiSyncCoordinator::newDaemonThread));
    }

    GlpiSyncCoordinator(EquipoGlpiCacheSyncService syncService, GlpiSyncJobStatus jobStatus,
                        ExecutorService executor) {
        this.syncService = syncService;
        this.jobStatus = jobStatus;
        this.executor = executor;
    }

    private static Thread newDaemonThread(Runnable runnable) {
        Thread thread = new Thread(runnable, "glpi-cache-sync-worker");
        thread.setDaemon(true);
        return thread;
    }

    public GlpiSyncStatus iniciar() {
        if (jobStatus.marcarInicio()) {
            executor.submit(() -> {
                try {
                    GlpiSyncResponse resultado = syncService.resincronizarTodo();
                    jobStatus.completarConExito(resultado);
                } catch (Exception e) {
                    log.warn("Error sincronizando cache local de equipos GLPI", e);
                    jobStatus.completarConError(e.getMessage());
                }
            });
        }
        return jobStatus.snapshot();
    }

    public GlpiSyncStatus estado() {
        return jobStatus.snapshot();
    }

    @Scheduled(fixedDelayString = "${equipos.glpi-cache-sync-interval-ms:300000}")
    public void sincronizacionProgramada() {
        iniciar();
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdownNow();
    }
}
