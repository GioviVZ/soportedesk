package com.inia.soportedesk.herramientas.monitoreo;

import java.time.Instant;

public record MonitorPingPuntoResponse(
        Instant fecha,
        Double latenciaPromedioMs,
        Double latenciaMinimaMs,
        Double latenciaMaximaMs,
        Double disponibilidadPorcentaje,
        Long muestras,
        Long disponibles
) {
}
