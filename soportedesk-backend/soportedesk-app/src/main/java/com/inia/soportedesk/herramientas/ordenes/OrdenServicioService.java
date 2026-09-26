package com.inia.soportedesk.herramientas.ordenes;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrdenServicioService {

    private final OrdenServicioRepository repository;

    @Transactional(readOnly = true)
    public List<OrdenServicioResponse> listar() {
        return repository.findAllByOrderByFinalizadaAscFechaVencimientoAsc().stream()
                .map(this::toResponse)
                .sorted(Comparator.comparing(OrdenServicioResponse::finalizada)
                        .thenComparingLong(this::diasAlerta)
                        .thenComparing(OrdenServicioResponse::fechaVencimiento))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenServicioResponse> listarProximas() {
        return repository.findAllByFinalizadaFalseOrderByFechaVencimientoAsc().stream()
                .map(this::toResponse)
                .sorted(Comparator.comparingLong(this::diasAlerta)
                        .thenComparing(OrdenServicioResponse::fechaVencimiento))
                .toList();
    }

    @Transactional
    public OrdenServicioResponse crear(OrdenServicioRequest request) {
        String numero = request.getNumeroOrden().trim();
        if (repository.existsByNumeroOrdenIgnoreCase(numero)) {
            throw new IllegalArgumentException("Ya existe una orden de servicio con el número " + numero);
        }

        OrdenServicio orden = new OrdenServicio();
        orden.setNumeroOrden(numero);
        aplicarDatos(orden, request);
        orden.setFinalizada(false);
        return toResponse(repository.save(orden));
    }

    @Transactional
    public OrdenServicioResponse actualizar(Long id, OrdenServicioRequest request) {
        OrdenServicio orden = findById(id);
        String numero = request.getNumeroOrden().trim();
        if (repository.existsByNumeroOrdenIgnoreCaseAndIdNot(numero, id)) {
            throw new IllegalArgumentException("Ya existe una orden de servicio con el número " + numero);
        }

        orden.setNumeroOrden(numero);
        aplicarDatos(orden, request);
        return toResponse(repository.save(orden));
    }

    @Transactional
    public OrdenServicioResponse cambiarFinalizada(Long id, boolean finalizada) {
        OrdenServicio orden = findById(id);
        orden.setFinalizada(finalizada);
        return toResponse(repository.save(orden));
    }

    @Transactional
    public OrdenServicioResponse cambiarHitoCompletado(Long id, Long hitoId, boolean completado) {
        OrdenServicio orden = findById(id);
        OrdenServicioHito hito = orden.getHitos().stream()
                .filter(item -> hitoId.equals(item.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Entregable no encontrado en la orden de servicio: " + hitoId));
        hito.setCompletado(completado);
        return toResponse(repository.save(orden));
    }

    @Transactional
    public void eliminar(Long id) {
        repository.delete(findById(id));
    }

    private OrdenServicio findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de servicio no encontrada: " + id));
    }

    private OrdenServicioResponse toResponse(OrdenServicio orden) {
        LocalDate hoy = LocalDate.now();
        long diasRestantes = ChronoUnit.DAYS.between(hoy, orden.getFechaVencimiento());
        long diasTranscurridos = Math.max(0, ChronoUnit.DAYS.between(orden.getFechaInicio(), hoy));
        List<OrdenServicioHitoResponse> hitos = orden.getHitos().stream()
                .sorted(Comparator.comparing(OrdenServicioHito::getDiaPlazo)
                        .thenComparing(hito -> hito.getId() == null ? Long.MAX_VALUE : hito.getId()))
                .map(hito -> {
                    LocalDate vencimiento = orden.getFechaInicio().plusDays(hito.getDiaPlazo());
                    return new OrdenServicioHitoResponse(
                            hito.getId(),
                            hito.getNombre(),
                            hito.getDiaPlazo(),
                            vencimiento,
                            ChronoUnit.DAYS.between(hoy, vencimiento),
                            Boolean.TRUE.equals(hito.getCompletado())
                    );
                })
                .toList();
        return new OrdenServicioResponse(
                orden.getId(),
                orden.getNumeroOrden(),
                orden.getDescripcion(),
                orden.getProveedor(),
                orden.getFechaInicio(),
                orden.getPlazoDias(),
                orden.getFechaVencimiento(),
                diasRestantes,
                diasTranscurridos,
                hitos,
                Boolean.TRUE.equals(orden.getFinalizada())
        );
    }

    private void aplicarDatos(OrdenServicio orden, OrdenServicioRequest request) {
        validarHitos(request);
        orden.setDescripcion(request.getDescripcion().trim());
        orden.setProveedor(blankToNull(request.getProveedor()));
        orden.setFechaInicio(request.getFechaInicio());
        orden.setPlazoDias(request.getPlazoDias());
        orden.setFechaVencimiento(request.getFechaInicio().plusDays(request.getPlazoDias()));
        sincronizarHitos(orden, request.getHitos());
    }

    private void validarHitos(OrdenServicioRequest request) {
        List<OrdenServicioHitoRequest> hitos = request.getHitos() == null ? List.of() : request.getHitos();
        Set<Integer> dias = new HashSet<>();
        for (OrdenServicioHitoRequest hito : hitos) {
            if (hito.getDiaPlazo() == null || hito.getDiaPlazo() <= 0) {
                throw new IllegalArgumentException("Cada entregable debe indicar un día mayor a cero");
            }
            if (hito.getDiaPlazo() > request.getPlazoDias()) {
                throw new IllegalArgumentException(
                        "El entregable del día " + hito.getDiaPlazo() + " supera la duración total de la orden");
            }
            if (!dias.add(hito.getDiaPlazo())) {
                throw new IllegalArgumentException("No puede haber dos entregables programados para el mismo día");
            }
        }
    }

    private void sincronizarHitos(OrdenServicio orden, List<OrdenServicioHitoRequest> solicitudes) {
        List<OrdenServicioHitoRequest> requests = solicitudes == null ? List.of() : solicitudes;
        var existentes = orden.getHitos().stream()
                .filter(hito -> hito.getId() != null)
                .collect(Collectors.toMap(OrdenServicioHito::getId, Function.identity()));
        List<OrdenServicioHito> deseados = new ArrayList<>();

        for (OrdenServicioHitoRequest request : requests) {
            OrdenServicioHito hito;
            if (request.getId() == null) {
                hito = existentes.values().stream()
                        .filter(item -> request.getDiaPlazo().equals(item.getDiaPlazo()))
                        .findFirst()
                        .orElse(null);
                if (hito != null) {
                    existentes.remove(hito.getId());
                } else {
                    hito = new OrdenServicioHito();
                    hito.setOrdenServicio(orden);
                    hito.setCompletado(false);
                }
            } else {
                hito = existentes.remove(request.getId());
                if (hito == null) {
                    throw new IllegalArgumentException("El entregable indicado no pertenece a esta orden");
                }
            }
            hito.setNombre(request.getNombre().trim());
            hito.setDiaPlazo(request.getDiaPlazo());
            deseados.add(hito);
        }

        orden.getHitos().removeIf(hito -> !deseados.contains(hito));
        for (OrdenServicioHito hito : deseados) {
            if (!orden.getHitos().contains(hito)) {
                orden.getHitos().add(hito);
            }
        }
    }

    private long diasAlerta(OrdenServicioResponse orden) {
        return orden.hitos().stream()
                .filter(hito -> !hito.completado())
                .mapToLong(OrdenServicioHitoResponse::diasRestantes)
                .min()
                .orElse(orden.diasRestantes());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
