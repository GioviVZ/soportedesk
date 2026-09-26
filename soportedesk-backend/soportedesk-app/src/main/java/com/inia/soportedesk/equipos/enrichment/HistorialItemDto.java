package com.inia.soportedesk.equipos.enrichment;

import java.time.LocalDateTime;

public record HistorialItemDto(
        String campo,
        String valorAnterior,
        String valorNuevo,
        String modificadoPor,
        LocalDateTime fechaModificacion
) {}
