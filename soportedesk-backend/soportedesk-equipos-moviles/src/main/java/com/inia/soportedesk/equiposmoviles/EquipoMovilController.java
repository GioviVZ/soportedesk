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
@RequestMapping("/api/equipos-moviles")
@RequiredArgsConstructor
public class EquipoMovilController {

    private final EquipoMovilService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public List<EquipoMovil> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TipoEquipoMovil tipo) {
        return service.findAll(tipo, search);
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public EquipoMovilResumen resumen() {
        return service.resumen();
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public EquipoMovil findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public ResponseEntity<EquipoMovil> create(@Valid @RequestBody EquipoMovilRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public EquipoMovil update(@PathVariable Long id, @Valid @RequestBody EquipoMovilRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
