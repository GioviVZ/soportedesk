package com.inia.soportedesk.herramientas.ordenes;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdenServicioService {

    private final OrdenServicioRepository repository;

    @Transactional(readOnly = true)
    public List<OrdenServicioResponse> listar() {
        return repository.findAllByOrderByFinalizadaAscFechaVencimientoAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrdenServicioResponse> listarProximas() {
        return repository.findAllByFinalizadaFalseOrderByFechaVencimientoAsc().stream()
                .map(this::toResponse)
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
        orden.setDescripcion(request.getDescripcion().trim());
        orden.setProveedor(blankToNull(request.getProveedor()));
        orden.setFechaInicio(request.getFechaInicio());
        orden.setPlazoDias(request.getPlazoDias());
        orden.setFechaVencimiento(request.getFechaInicio().plusDays(request.getPlazoDias()));
        orden.setFinalizada(false);
        orden.setRegistradoPor(currentUsername());
        orden.setFechaRegistro(LocalDateTime.now());
        return toResponse(repository.save(orden));
    }

    @Transactional
    public OrdenServicioResponse cambiarFinalizada(Long id, boolean finalizada) {
        OrdenServicio orden = findById(id);
        orden.setFinalizada(finalizada);
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
        long diasRestantes = ChronoUnit.DAYS.between(LocalDate.now(), orden.getFechaVencimiento());
        return new OrdenServicioResponse(
                orden.getId(),
                orden.getNumeroOrden(),
                orden.getDescripcion(),
                orden.getProveedor(),
                orden.getFechaInicio(),
                orden.getPlazoDias(),
                orden.getFechaVencimiento(),
                diasRestantes,
                Boolean.TRUE.equals(orden.getFinalizada()),
                orden.getRegistradoPor(),
                orden.getFechaRegistro()
        );
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null || authentication.getName() == null ? "sistema" : authentication.getName();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
