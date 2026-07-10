package com.inia.soportedesk.activedirectory.dto;

import java.time.LocalDateTime;

public record AdSyncStatus(
        boolean running,
        int procesados,
        int total,
        LocalDateTime iniciadoEn,
        LocalDateTime finalizadoEn,
        AdSyncResponse ultimoResultado,
        String error
) {
}
