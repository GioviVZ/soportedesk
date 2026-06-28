package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos/modelos-impresora")
@RequiredArgsConstructor
public class ModeloImpresoraController {

    private final ModeloImpresoraService service;

    @GetMapping
    public List<ModeloImpresora> findAll(@RequestParam(required = false) Long marcaId,
                                          @RequestParam(required = false) String search) {
        return service.findAll(marcaId, search);
    }

    @GetMapping("/{id}")
    public ModeloImpresora findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ModeloImpresora> create(@Valid @RequestBody ModeloImpresoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ModeloImpresora update(@PathVariable Long id, @Valid @RequestBody ModeloImpresoraRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
