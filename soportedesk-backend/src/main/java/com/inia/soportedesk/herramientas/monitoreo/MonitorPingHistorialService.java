package com.inia.soportedesk.herramientas.monitoreo;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MonitorPingHistorialService {

    private final MonitorPingRepository monitorRepository;
    private final MonitorPingMuestraRepository muestraRepository;
    private final MonitorPingResumenHoraRepository resumenRepository;

    @Value("${monitoreo-ping.retencion-detalle-dias:7}")
    private int retencionDetalleDias;

    @Transactional(readOnly = true)
    public MonitorPingHistorialResponse obtener(Long monitorId, Instant desde, Instant hasta, int maxPuntos) {
        if (!monitorRepository.existsById(monitorId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Monitor no encontrado");
        }

        Instant fin = hasta == null ? Instant.now() : hasta;
        Instant inicio = desde == null ? fin.minus(1, ChronoUnit.HOURS) : desde;
        if (!inicio.isBefore(fin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rango de fechas no es valido");
        }
        if (Duration.between(inicio, fin).toDays() > 366) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rango maximo es 12 meses");
        }

        int limite = Math.max(30, Math.min(maxPuntos, 500));
        boolean usarDetalle = !inicio.isBefore(Instant.now().minus(retencionDetalleDias, ChronoUnit.DAYS));
        List<MonitorPingPuntoResponse> base = usarDetalle
                ? desdeMuestras(monitorId, inicio, fin)
                : desdeResumenes(monitorId, inicio, fin);
        List<MonitorPingPuntoResponse> puntos = agrupar(base, inicio, fin, limite);

        return new MonitorPingHistorialResponse(
                monitorId,
                inicio,
                fin,
                usarDetalle ? "DETALLE" : "HORARIA",
                puntos,
                estadisticas(base)
        );
    }

    private List<MonitorPingPuntoResponse> desdeMuestras(Long monitorId, Instant desde, Instant hasta) {
        return muestraRepository.findByMonitorIdAndFechaBetweenOrderByFechaAsc(monitorId, desde, hasta).stream()
                .map(muestra -> new MonitorPingPuntoResponse(
                        muestra.getFecha(),
                        muestra.getLatenciaMs(),
                        muestra.getLatenciaMs(),
                        muestra.getLatenciaMs(),
                        muestra.getDisponible() ? 100.0 : 0.0,
                        1L,
                        muestra.getDisponible() ? 1L : 0L
                ))
                .toList();
    }

    private List<MonitorPingPuntoResponse> desdeResumenes(Long monitorId, Instant desde, Instant hasta) {
        return resumenRepository.findByMonitorIdAndHoraBetweenOrderByHoraAsc(monitorId, desde, hasta).stream()
                .map(resumen -> new MonitorPingPuntoResponse(
                        resumen.getHora(),
                        resumen.getLatenciaPromedioMs(),
                        resumen.getLatenciaMinimaMs(),
                        resumen.getLatenciaMaximaMs(),
                        MonitorPingMapper.porcentaje(resumen.getDisponibles(), resumen.getMuestras()),
                        resumen.getMuestras(),
                        resumen.getDisponibles()
                ))
                .toList();
    }

    private List<MonitorPingPuntoResponse> agrupar(List<MonitorPingPuntoResponse> puntos,
                                                   Instant desde,
                                                   Instant hasta,
                                                   int maxPuntos) {
        if (puntos.size() <= maxPuntos) {
            return puntos;
        }

        long rangoMs = Math.max(1L, Duration.between(desde, hasta).toMillis());
        long bucketMs = Math.max(1L, (long) Math.ceil(rangoMs / (double) maxPuntos));
        Map<Long, Acumulador> buckets = new LinkedHashMap<>();
        for (MonitorPingPuntoResponse punto : puntos) {
            long indice = Math.max(0L, Duration.between(desde, punto.fecha()).toMillis()) / bucketMs;
            buckets.computeIfAbsent(indice, ignored -> new Acumulador())
                    .agregar(punto);
        }

        List<MonitorPingPuntoResponse> agrupados = new ArrayList<>(buckets.size());
        buckets.forEach((indice, acumulador) -> agrupados.add(
                acumulador.toResponse(desde.plusMillis(indice * bucketMs))));
        return agrupados;
    }

    private MonitorPingEstadisticasResponse estadisticas(List<MonitorPingPuntoResponse> puntos) {
        Acumulador acumulador = new Acumulador();
        puntos.forEach(acumulador::agregar);
        return acumulador.toEstadisticas();
    }

    private static final class Acumulador {
        private long muestras;
        private long disponibles;
        private long muestrasConLatencia;
        private double sumaLatencia;
        private Double minima;
        private Double maxima;

        void agregar(MonitorPingPuntoResponse punto) {
            muestras += punto.muestras();
            disponibles += punto.disponibles();
            if (punto.latenciaPromedioMs() != null) {
                long peso = Math.max(1L, punto.disponibles());
                sumaLatencia += punto.latenciaPromedioMs() * peso;
                muestrasConLatencia += peso;
                minima = minima == null ? punto.latenciaMinimaMs() : Math.min(minima, punto.latenciaMinimaMs());
                maxima = maxima == null ? punto.latenciaMaximaMs() : Math.max(maxima, punto.latenciaMaximaMs());
            }
        }

        MonitorPingPuntoResponse toResponse(Instant fecha) {
            return new MonitorPingPuntoResponse(
                    fecha,
                    promedio(),
                    minima,
                    maxima,
                    MonitorPingMapper.porcentaje(disponibles, muestras),
                    muestras,
                    disponibles
            );
        }

        MonitorPingEstadisticasResponse toEstadisticas() {
            double disponibilidad = MonitorPingMapper.porcentaje(disponibles, muestras);
            double perdida = muestras == 0 ? 0.0 : Math.round((100.0 - disponibilidad) * 10.0) / 10.0;
            return new MonitorPingEstadisticasResponse(
                    muestras,
                    disponibles,
                    promedio(),
                    minima,
                    maxima,
                    disponibilidad,
                    perdida
            );
        }

        private Double promedio() {
            return muestrasConLatencia == 0 ? null : Math.round(sumaLatencia * 10.0 / muestrasConLatencia) / 10.0;
        }
    }
}
