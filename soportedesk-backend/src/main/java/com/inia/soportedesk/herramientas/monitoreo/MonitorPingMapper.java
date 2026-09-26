package com.inia.soportedesk.herramientas.monitoreo;

final class MonitorPingMapper {

    private MonitorPingMapper() {
    }

    static MonitorPingResponse toResponse(MonitorPing monitor) {
        long total = value(monitor.getTotalMuestras());
        long fallidas = value(monitor.getTotalFallidas());
        return new MonitorPingResponse(
                monitor.getId(),
                monitor.getNombre(),
                monitor.getHost(),
                monitor.getIntervaloSegundos(),
                monitor.getEstado(),
                salud(monitor),
                monitor.getCreadoPor(),
                monitor.getUltimaMedicion(),
                monitor.getProximaMedicion(),
                monitor.getUltimaDisponible(),
                monitor.getUltimaLatenciaMs(),
                total,
                fallidas,
                porcentaje(fallidas, total)
        );
    }

    static String salud(MonitorPing monitor) {
        if (monitor.getEstado() == MonitorPingEstado.PAUSADO) {
            return "PAUSADO";
        }
        if (monitor.getEstado() == MonitorPingEstado.ARCHIVADO) {
            return "ARCHIVADO";
        }
        if (monitor.getUltimaDisponible() == null) {
            return "PENDIENTE";
        }
        if (!monitor.getUltimaDisponible()) {
            return "SIN_RESPUESTA";
        }
        if (monitor.getUltimaLatenciaMs() != null && monitor.getUltimaLatenciaMs() > 80) {
            return "LATENCIA_ALTA";
        }
        return "DISPONIBLE";
    }

    static double porcentaje(long parte, long total) {
        if (total == 0) {
            return 0;
        }
        return Math.round(parte * 1000.0 / total) / 10.0;
    }

    private static long value(Long value) {
        return value == null ? 0L : value;
    }
}
