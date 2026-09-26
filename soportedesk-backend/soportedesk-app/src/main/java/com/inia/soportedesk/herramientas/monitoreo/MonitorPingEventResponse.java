package com.inia.soportedesk.herramientas.monitoreo;

import java.time.Instant;

public record MonitorPingEventResponse(
        Long monitorId,
        Instant fecha,
        Boolean disponible,
        Double latenciaMs,
        String salud,
        Long totalMuestras,
        Long totalFallidas,
        Double perdidaPorcentaje
) {
}
