package com.inia.soportedesk.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios-sistema")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UsuarioSistemaController {

    private final UsuarioSistemaService service;

    @GetMapping
    public List<UsuarioSistemaResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public UsuarioSistemaResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<UsuarioSistemaResponse> create(@Valid @RequestBody UsuarioSistemaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public UsuarioSistemaResponse update(@PathVariable Long id, @Valid @RequestBody UsuarioSistemaRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
