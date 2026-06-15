package com.inia.soportedesk.usuariosred;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios-red")
@RequiredArgsConstructor
public class UsuarioRedController {

    private final UsuarioRedService service;

    @GetMapping
    public List<UsuarioRed> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public UsuarioRed findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioRed> create(@Valid @RequestBody UsuarioRedRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioRed update(@PathVariable Long id, @Valid @RequestBody UsuarioRedRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
