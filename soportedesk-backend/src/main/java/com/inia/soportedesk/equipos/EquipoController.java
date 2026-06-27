package com.inia.soportedesk.equipos;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoController {

    private final EquipoService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<Equipo> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/con-red")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<Equipo> findConRed() {
        return service.findConRed();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public Equipo findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public ResponseEntity<Equipo> create(@Valid @RequestBody EquipoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public Equipo update(@PathVariable Long id, @Valid @RequestBody EquipoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
