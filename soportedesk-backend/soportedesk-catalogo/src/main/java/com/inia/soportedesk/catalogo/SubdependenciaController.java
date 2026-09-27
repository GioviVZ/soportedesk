package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos/subdependencias")
@RequiredArgsConstructor
public class SubdependenciaController {

    private final SubdependenciaService service;

    @GetMapping
    public List<Subdependencia> findAll(@RequestParam(required = false) Long dependenciaId,
                                         @RequestParam(required = false) String search) {
        return service.findAll(dependenciaId, search);
    }

    @GetMapping("/{id}")
    public Subdependencia findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ResponseEntity<Subdependencia> create(@Valid @RequestBody SubdependenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public Subdependencia update(@PathVariable Long id, @Valid @RequestBody SubdependenciaRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
