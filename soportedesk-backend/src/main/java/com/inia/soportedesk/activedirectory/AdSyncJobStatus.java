package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
import com.inia.soportedesk.activedirectory.dto.AdSyncStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Estado en memoria del job de sincronizacion de AD. Un solo servidor, un solo job a la vez.
 * marcarInicio() es el unico punto de exclusion real (synchronized, check-and-set atomico).
 */
@Component
public class AdSyncJobStatus {
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicInteger procesados = new AtomicInteger(0);
    private final AtomicInteger total = new AtomicInteger(0);
    private volatile LocalDateTime iniciadoEn;
    private volatile LocalDateTime finalizadoEn;
    private volatile AdSyncResponse ultimoResultado;
    private volatile String error;

    public synchronized boolean marcarInicio() {
        if (running.get()) {
            return false;
        }
        running.set(true);
        procesados.set(0);
        total.set(0);
        iniciadoEn = LocalDateTime.now();
        finalizadoEn = null;
        error = null;
        return true;
    }

    public void setTotal(int value) {
        total.set(value);
    }

    public void incrementarProcesados(int delta) {
        procesados.addAndGet(delta);
    }

    public void completarConExito(AdSyncResponse resultado) {
        ultimoResultado = resultado;
        finalizadoEn = LocalDateTime.now();
        running.set(false);
    }

    public void completarConError(String mensaje) {
        error = mensaje;
        finalizadoEn = LocalDateTime.now();
        running.set(false);
    }

    public AdSyncStatus snapshot() {
        return new AdSyncStatus(running.get(), procesados.get(), total.get(), iniciadoEn, finalizadoEn, ultimoResultado, error);
    }
}
