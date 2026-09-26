package com.inia.soportedesk.activedirectory.dto;

import java.time.LocalDateTime;

public record AdSyncResponse(
        int usuariosSincronizados,
        int controladoresDominio,
        LocalDateTime sincronizadoEn
) {
}
