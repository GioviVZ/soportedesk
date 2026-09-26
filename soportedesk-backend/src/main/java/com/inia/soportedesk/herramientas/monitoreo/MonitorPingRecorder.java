package com.inia.soportedesk.herramientas.monitoreo;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class MonitorPingRecorder {

    private final MonitorPingRepository monitorRepository;
    private final MonitorPingMuestraRepository muestraRepository;
    private final MonitorPingResumenHoraRepository resumenRepository;
    private final MonitorPingEventService eventService;

    @Transactional
    public void registrar(Long monitorId, Instant fecha, boolean disponible, Double latenciaMs) {
        MonitorPing monitor = monitorRepository.findById(monitorId).orElse(null);
        if (monitor == null) {
            return;
        }

        Instant hora = fecha.truncatedTo(ChronoUnit.HOURS);
        long latenciasAnteriores = latenciaMs == null ? 0L
                : muestraRepository.countByMonitorIdAndFechaGreaterThanEqualAndFechaLessThanAndLatenciaMsIsNotNull(
                        monitorId, hora, hora.plus(1, ChronoUnit.HOURS));

        MonitorPingMuestra muestra = new MonitorPingMuestra();
        muestra.setMonitor(monitor);
        muestra.setFecha(fecha);
        muestra.setDisponible(disponible);
        muestra.setLatenciaMs(latenciaMs);
        muestraRepository.save(muestra);

        long total = value(monitor.getTotalMuestras()) + 1;
        long fallidas = value(monitor.getTotalFallidas()) + (disponible ? 0 : 1);
        monitor.setUltimaMedicion(fecha);
        monitor.setUltimaDisponible(disponible);
        monitor.setUltimaLatenciaMs(latenciaMs);
        monitor.setTotalMuestras(total);
        monitor.setTotalFallidas(fallidas);
        monitorRepository.save(monitor);

        actualizarResumen(monitor, hora, disponible, latenciaMs, latenciasAnteriores);

        eventService.publish(new MonitorPingEventResponse(
                monitorId,
                fecha,
                disponible,
                latenciaMs,
                MonitorPingMapper.salud(monitor),
                total,
                fallidas,
                MonitorPingMapper.porcentaje(fallidas, total)
        ));
    }

    private void actualizarResumen(MonitorPing monitor, Instant hora, boolean disponible, Double latenciaMs,
                                   long latenciasAnteriores) {
        MonitorPingResumenHora resumen = resumenRepository.findByMonitorIdAndHora(monitor.getId(), hora)
                .orElseGet(() -> nuevoResumen(monitor, hora));

        resumen.setMuestras(value(resumen.getMuestras()) + 1);
        resumen.setDisponibles(value(resumen.getDisponibles()) + (disponible ? 1 : 0));
        if (latenciaMs != null) {
            double sumaAnterior = value(resumen.getLatenciaPromedioMs()) * latenciasAnteriores;
            resumen.setLatenciaPromedioMs(
                    Math.round((sumaAnterior + latenciaMs) * 10.0 / (latenciasAnteriores + 1)) / 10.0);
            resumen.setLatenciaMinimaMs(resumen.getLatenciaMinimaMs() == null
                    ? latenciaMs : Math.min(resumen.getLatenciaMinimaMs(), latenciaMs));
            resumen.setLatenciaMaximaMs(resumen.getLatenciaMaximaMs() == null
                    ? latenciaMs : Math.max(resumen.getLatenciaMaximaMs(), latenciaMs));
        }
        resumenRepository.save(resumen);
    }

    private MonitorPingResumenHora nuevoResumen(MonitorPing monitor, Instant hora) {
        MonitorPingResumenHora resumen = new MonitorPingResumenHora();
        resumen.setMonitor(monitor);
        resumen.setHora(hora);
        return resumen;
    }

    private long value(Long value) {
        return value == null ? 0L : value;
    }

    private double value(Double value) {
        return value == null ? 0.0 : value;
    }
}
