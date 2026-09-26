package com.inia.soportedesk.equipos.glpicache.dto;

import java.time.LocalDateTime;

public record GlpiSyncStatus(
        boolean running,
        int procesados,
        int total,
        LocalDateTime iniciadoEn,
        LocalDateTime finalizadoEn,
        GlpiSyncResponse ultimoResultado,
        String error
) {
}
