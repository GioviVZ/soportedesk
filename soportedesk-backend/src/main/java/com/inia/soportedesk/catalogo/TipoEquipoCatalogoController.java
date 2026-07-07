package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos/tipo-equipo")
@RequiredArgsConstructor
public class TipoEquipoCatalogoController {

    private final TipoEquipoCatalogoService service;

    @GetMapping
    public List<TipoEquipoCatalogo> findAll() {
        return service.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ResponseEntity<TipoEquipoCatalogo> create(@Valid @RequestBody TipoEquipoCatalogoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public TipoEquipoCatalogo update(@PathVariable Long id, @Valid @RequestBody TipoEquipoCatalogoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
