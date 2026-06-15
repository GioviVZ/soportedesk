package com.inia.soportedesk.impresoras;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/impresoras")
@RequiredArgsConstructor
public class ImpresoraController {

    private final ImpresoraService service;

    @GetMapping
    public List<Impresora> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public Impresora findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Impresora> create(@Valid @RequestBody ImpresoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Impresora update(@PathVariable Long id, @Valid @RequestBody ImpresoraRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
