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
@RequestMapping("/api/telefonia-fija/telefonos")
@RequiredArgsConstructor
public class TelefonoFijoController {

    private final TelefonoFijoService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_telefonia-fija')")
    public List<TelefonoFijo> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TipoTelefonoFijo tipo) {
        return service.findAll(tipo, search);
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_telefonia-fija')")
    public TelefonoFijoResumen resumen() {
        return service.resumen();
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_telefonia-fija')")
    public TelefonoFijo findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_telefonia-fija')")
    public ResponseEntity<TelefonoFijo> create(@Valid @RequestBody TelefonoFijoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_telefonia-fija')")
    public TelefonoFijo update(@PathVariable Long id, @Valid @RequestBody TelefonoFijoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_telefonia-fija')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
