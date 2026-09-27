package com.inia.soportedesk.herramientas.monitoreo;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MonitorPingService {

    private static final long MAX_MONITORES_ACTIVOS = 50;

    private final MonitorPingRepository repository;

    @Transactional(readOnly = true)
    public List<MonitorPingResponse> listar() {
        return repository.findAllByOrderByNombreAsc().stream()
                .map(MonitorPingMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MonitorPingResponse obtener(Long id) {
        return MonitorPingMapper.toResponse(buscar(id));
    }

    @Transactional
    public MonitorPingResponse crear(MonitorPingRequest request, String usuario) {
        String nombre = request.getNombre().trim();
        validarNombreDisponible(nombre, null);
        validarCupoActivo();

        Instant ahora = Instant.now();
        MonitorPing monitor = new MonitorPing();
        monitor.setNombre(nombre);
        monitor.setHost(request.getHost().trim());
        monitor.setIntervaloSegundos(intervalo(request));
        monitor.setEstado(MonitorPingEstado.ACTIVO);
        monitor.setCreadoPor(usuario);
        monitor.setProximaMedicion(ahora);
        return MonitorPingMapper.toResponse(repository.save(monitor));
    }

    @Transactional
    public MonitorPingResponse actualizar(Long id, MonitorPingRequest request) {
        MonitorPing monitor = buscar(id);
        String nombre = request.getNombre().trim();
        validarNombreDisponible(nombre, id);
        monitor.setNombre(nombre);
        monitor.setHost(request.getHost().trim());
        monitor.setIntervaloSegundos(intervalo(request));
        if (monitor.getEstado() == MonitorPingEstado.ACTIVO) {
            monitor.setProximaMedicion(Instant.now());
        }
        return MonitorPingMapper.toResponse(repository.save(monitor));
    }

    @Transactional
    public MonitorPingResponse pausar(Long id) {
        MonitorPing monitor = buscar(id);
        monitor.setEstado(MonitorPingEstado.PAUSADO);
        monitor.setProximaMedicion(null);
        return MonitorPingMapper.toResponse(repository.save(monitor));
    }

    @Transactional
    public MonitorPingResponse reanudar(Long id) {
        MonitorPing monitor = buscar(id);
        if (monitor.getEstado() != MonitorPingEstado.ACTIVO) {
            validarCupoActivo();
        }
        monitor.setEstado(MonitorPingEstado.ACTIVO);
        monitor.setProximaMedicion(Instant.now());
        return MonitorPingMapper.toResponse(repository.save(monitor));
    }

    @Transactional
    public MonitorPingResponse archivar(Long id) {
        MonitorPing monitor = buscar(id);
        monitor.setEstado(MonitorPingEstado.ARCHIVADO);
        monitor.setProximaMedicion(null);
        return MonitorPingMapper.toResponse(repository.save(monitor));
    }

    @Transactional
    public void eliminar(Long id) {
        MonitorPing monitor = buscar(id);
        repository.delete(monitor);
    }

    private MonitorPing buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Monitor no encontrado"));
    }

    private void validarNombreDisponible(String nombre, Long id) {
        boolean existe = id == null
                ? repository.existsByNombreIgnoreCase(nombre)
                : repository.existsByNombreIgnoreCaseAndIdNot(nombre, id);
        if (existe) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un monitor con ese nombre");
        }
    }

    private void validarCupoActivo() {
        if (repository.countByEstado(MonitorPingEstado.ACTIVO) >= MAX_MONITORES_ACTIVOS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Se alcanzo el maximo de 50 monitores activos");
        }
    }

    private int intervalo(MonitorPingRequest request) {
        return request.getIntervaloSegundos() == null ? 10 : request.getIntervaloSegundos();
    }
}
