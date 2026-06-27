package com.inia.soportedesk.wifi;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wifi")
@RequiredArgsConstructor
public class WifiController {

    private final WifiService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_wifi')")
    public List<Wifi> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_wifi')")
    public Wifi findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_wifi')")
    public ResponseEntity<Wifi> create(@Valid @RequestBody WifiRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_wifi')")
    public Wifi update(@PathVariable Long id, @Valid @RequestBody WifiRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_wifi')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
