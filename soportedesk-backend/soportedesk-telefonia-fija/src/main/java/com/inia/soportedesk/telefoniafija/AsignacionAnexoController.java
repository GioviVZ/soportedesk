package com.inia.soportedesk.telefoniafija;

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
@RequestMapping("/api/telefonia-fija/asignaciones")
@RequiredArgsConstructor
public class AsignacionAnexoController {

    private final AsignacionAnexoService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_telefonia-fija')")
    public List<AsignacionAnexo> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long sedeId,
            @RequestParam(required = false) String estado) {
        return service.findAll(search, sedeId, estado);
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_telefonia-fija')")
    public AsignacionAnexoResumen resumen() {
        return service.resumen();
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_telefonia-fija')")
    public AsignacionAnexo findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_telefonia-fija')")
    public ResponseEntity<AsignacionAnexo> create(@Valid @RequestBody AsignacionAnexoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_telefonia-fija')")
    public AsignacionAnexo update(@PathVariable Long id, @Valid @RequestBody AsignacionAnexoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_telefonia-fija')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
