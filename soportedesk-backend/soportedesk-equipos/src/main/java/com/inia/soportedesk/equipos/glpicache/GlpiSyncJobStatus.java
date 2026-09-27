package com.inia.soportedesk.equipos.glpicache;

import com.inia.soportedesk.equipos.glpicache.dto.GlpiSyncResponse;
import com.inia.soportedesk.equipos.glpicache.dto.GlpiSyncStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class GlpiSyncJobStatus {
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicInteger procesados = new AtomicInteger(0);
    private final AtomicInteger total = new AtomicInteger(0);
    private volatile LocalDateTime iniciadoEn;
    private volatile LocalDateTime finalizadoEn;
    private volatile GlpiSyncResponse ultimoResultado;
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

    public void completarConExito(GlpiSyncResponse resultado) {
        ultimoResultado = resultado;
        finalizadoEn = LocalDateTime.now();
        running.set(false);
    }

    public void completarConError(String mensaje) {
        error = mensaje;
        finalizadoEn = LocalDateTime.now();
        running.set(false);
    }

    public GlpiSyncStatus snapshot() {
        return new GlpiSyncStatus(running.get(), procesados.get(), total.get(), iniciadoEn,
                finalizadoEn, ultimoResultado, error);
    }
}
