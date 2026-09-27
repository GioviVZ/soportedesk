package com.inia.soportedesk.herramientas.monitoreo;

public record MonitorPingEstadisticasResponse(
        Long muestras,
        Long disponibles,
        Double latenciaPromedioMs,
        Double latenciaMinimaMs,
        Double latenciaMaximaMs,
        Double disponibilidadPorcentaje,
        Double perdidaPorcentaje
) {
}
