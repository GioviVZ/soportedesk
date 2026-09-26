package com.inia.soportedesk.herramientas.monitoreo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/herramientas/monitores-ping")
@RequiredArgsConstructor
public class MonitorPingController {

    private static final String READ = "hasRole('ADMIN') || hasAuthority('READ_herramientas')";
    private static final String WRITE = "hasRole('ADMIN') || hasAuthority('WRITE_herramientas')";

    private final MonitorPingService service;
    private final MonitorPingHistorialService historialService;
    private final MonitorPingEventService eventService;

    @GetMapping
    @PreAuthorize(READ)
    public List<MonitorPingResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    @PreAuthorize(READ)
    public MonitorPingResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @GetMapping("/{id}/historial")
    @PreAuthorize(READ)
    public MonitorPingHistorialResponse historial(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta,
            @RequestParam(defaultValue = "300") int maxPuntos) {
        return historialService.obtener(id, desde, hasta, maxPuntos);
    }

    @GetMapping(value = "/events", produces = "text/event-stream")
    @PreAuthorize(READ)
    public SseEmitter events() {
        return eventService.subscribe();
    }

    @PostMapping
    @PreAuthorize(WRITE)
    public ResponseEntity<MonitorPingResponse> crear(@Valid @RequestBody MonitorPingRequest request,
                                                     Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize(WRITE)
    public MonitorPingResponse actualizar(@PathVariable Long id,
                                           @Valid @RequestBody MonitorPingRequest request) {
        return service.actualizar(id, request);
    }

    @PatchMapping("/{id}/pausar")
    @PreAuthorize(WRITE)
    public MonitorPingResponse pausar(@PathVariable Long id) {
        return service.pausar(id);
    }

    @PatchMapping("/{id}/reanudar")
    @PreAuthorize(WRITE)
    public MonitorPingResponse reanudar(@PathVariable Long id) {
        return service.reanudar(id);
    }

    @PatchMapping("/{id}/archivar")
    @PreAuthorize(WRITE)
    public MonitorPingResponse archivar(@PathVariable Long id) {
        return service.archivar(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
