package com.inia.soportedesk.equipos.enrichment;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoEnrichmentController {

    private final EquipoEnrichmentService service;

    @GetMapping("/{id}/enrichment")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public ResponseEntity<EquipoEnrichmentDto> getEnrichment(@PathVariable Long id) {
        return service.findByComputerId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping("/{id}/enrichment")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public EquipoEnrichmentDto saveEnrichment(@PathVariable Long id,
                                               @RequestBody EquipoEnrichmentDto dto,
                                               Authentication auth) {
        return service.save(id, dto, auth.getName());
    }

    @GetMapping("/{id}/historial")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<HistorialItemDto> getHistorial(@PathVariable Long id) {
        return service.getHistorial(id);
    }
}
