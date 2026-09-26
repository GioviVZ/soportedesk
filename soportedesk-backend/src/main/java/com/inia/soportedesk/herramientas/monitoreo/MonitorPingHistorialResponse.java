package com.inia.soportedesk.herramientas.monitoreo;

import java.time.Instant;
import java.util.List;

public record MonitorPingHistorialResponse(
        Long monitorId,
        Instant desde,
        Instant hasta,
        String resolucion,
        List<MonitorPingPuntoResponse> puntos,
        MonitorPingEstadisticasResponse estadisticas
) {
}
