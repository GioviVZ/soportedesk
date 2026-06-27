package com.inia.soportedesk.vpn;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vpn")
@RequiredArgsConstructor
public class VpnController {

    private final VpnService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_vpn')")
    public List<Vpn> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_vpn')")
    public Vpn findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_vpn')")
    public ResponseEntity<Vpn> create(@Valid @RequestBody VpnRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, auth));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_vpn')")
    public Vpn update(@PathVariable Long id, @Valid @RequestBody VpnRequest request, Authentication auth) {
        return service.update(id, request, auth);
    }

    @PatchMapping("/{id}/antivirus")
    public Vpn updateAntivirus(@PathVariable Long id, @RequestBody VpnAntivirusRequest request) {
        return service.updateAntivirus(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
