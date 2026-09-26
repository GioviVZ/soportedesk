package com.inia.soportedesk.herramientas.monitoreo;

import java.time.Instant;

public record MonitorPingResponse(
        Long id,
        String nombre,
        String host,
        Integer intervaloSegundos,
        MonitorPingEstado estado,
        String salud,
        String creadoPor,
        Instant ultimaMedicion,
        Instant proximaMedicion,
        Boolean ultimaDisponible,
        Double ultimaLatenciaMs,
        Long totalMuestras,
        Long totalFallidas,
        Double perdidaPorcentaje
) {
}
