package com.inia.soportedesk.herramientas.ordenes;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/herramientas/ordenes-servicio")
@RequiredArgsConstructor
public class OrdenServicioController {

    private final OrdenServicioService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_herramientas')")
    public List<OrdenServicioResponse> listar() {
        return service.listar();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_herramientas')")
    public ResponseEntity<OrdenServicioResponse> crear(@Valid @RequestBody OrdenServicioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request));
    }

    @PatchMapping("/{id}/finalizar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_herramientas')")
    public OrdenServicioResponse finalizar(@PathVariable Long id) {
        return service.cambiarFinalizada(id, true);
    }

    @PatchMapping("/{id}/reactivar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_herramientas')")
    public OrdenServicioResponse reactivar(@PathVariable Long id) {
        return service.cambiarFinalizada(id, false);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_herramientas')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
