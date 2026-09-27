package com.inia.soportedesk.equipos.glpicache.dto;

import java.time.LocalDateTime;

public record GlpiSyncResponse(
        int totalSincronizados,
        int eliminadosDeCache,
        LocalDateTime sincronizadoEn
) {
}
