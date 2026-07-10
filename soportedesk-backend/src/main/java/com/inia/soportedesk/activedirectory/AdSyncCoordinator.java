package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
import com.inia.soportedesk.activedirectory.dto.AdSyncStatus;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Orquesta la sincronizacion de AD en un hilo de fondo (iniciar/estado) y reprograma
 * (debounce) un sync automatico 30s despues del ultimo AdCambioEvent recibido.
 */
@Service
public class AdSyncCoordinator {
    private static final Logger log = LoggerFactory.getLogger(AdSyncCoordinator.class);
    private static final long DEBOUNCE_SECONDS = 30;

    private final ActiveDirectoryService activeDirectoryService;
    private final AdSyncJobStatus jobStatus;
    private final ExecutorService executor;
    private final ScheduledExecutorService scheduler;
    private volatile ScheduledFuture<?> pendingAutoSync;

    public AdSyncCoordinator(ActiveDirectoryService activeDirectoryService, AdSyncJobStatus jobStatus) {
        this(activeDirectoryService, jobStatus,
                Executors.newSingleThreadExecutor(AdSyncCoordinator::newDaemonThread),
                Executors.newSingleThreadScheduledExecutor(AdSyncCoordinator::newDaemonThread));
    }

    AdSyncCoordinator(ActiveDirectoryService activeDirectoryService, AdSyncJobStatus jobStatus,
                       ExecutorService executor, ScheduledExecutorService scheduler) {
        this.activeDirectoryService = activeDirectoryService;
        this.jobStatus = jobStatus;
        this.executor = executor;
        this.scheduler = scheduler;
    }

    private static Thread newDaemonThread(Runnable runnable) {
        Thread thread = new Thread(runnable, "ad-sync-worker");
        thread.setDaemon(true);
        return thread;
    }

    public AdSyncStatus iniciar() {
        if (jobStatus.marcarInicio()) {
            executor.submit(() -> {
                try {
                    AdSyncResponse resultado = activeDirectoryService.sincronizarCache();
                    jobStatus.completarConExito(resultado);
                } catch (Exception e) {
                    log.warn("Error sincronizando cache de Active Directory", e);
                    jobStatus.completarConError(e.getMessage());
                }
            });
        }
        return jobStatus.snapshot();
    }

    public AdSyncStatus estado() {
        return jobStatus.snapshot();
    }

    @EventListener
    public void onCambio(AdCambioEvent event) {
        notificarCambio();
    }

    synchronized void notificarCambio() {
        if (pendingAutoSync != null) {
            pendingAutoSync.cancel(false);
        }
        pendingAutoSync = scheduler.schedule(() -> { iniciar(); }, DEBOUNCE_SECONDS, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdownNow();
        scheduler.shutdownNow();
    }
}
