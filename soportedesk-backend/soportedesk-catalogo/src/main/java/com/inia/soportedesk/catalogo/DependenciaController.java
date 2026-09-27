package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos/dependencias")
@RequiredArgsConstructor
public class DependenciaController {

    private final DependenciaService service;

    @GetMapping
    public List<Dependencia> findAll(@RequestParam(required = false) Long sedeId,
                                      @RequestParam(required = false) String search) {
        return service.findAll(sedeId, search);
    }

    @GetMapping("/{id}")
    public Dependencia findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ResponseEntity<Dependencia> create(@Valid @RequestBody DependenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public Dependencia update(@PathVariable Long id, @Valid @RequestBody DependenciaRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
