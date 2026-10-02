package com.inia.soportedesk.equiposmoviles;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/equipos-moviles/asignaciones")
@RequiredArgsConstructor
public class AsignacionNumeroMovilController {

    private final AsignacionNumeroMovilService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public List<AsignacionNumeroMovil> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String operador,
            @RequestParam(required = false) String estado) {
        return service.findAll(search, operador, estado);
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public AsignacionNumeroMovilResumen resumen() {
        return service.resumen();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public AsignacionNumeroMovil findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public ResponseEntity<AsignacionNumeroMovil> create(
            @Valid @RequestBody AsignacionNumeroMovilRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public AsignacionNumeroMovil update(
            @PathVariable Long id,
            @Valid @RequestBody AsignacionNumeroMovilRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
