package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.glpi.GlpiTecladoService;
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
    private final GlpiTecladoService glpiTecladoService;

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

    @PostMapping("/{id}/baja")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public EquipoEnrichmentDto darDeBaja(@PathVariable Long id,
                                          @RequestBody BajaRequest request,
                                          Authentication auth) {
        return service.darDeBaja(id, request.motivo(), auth.getName());
    }

    public record BajaRequest(String motivo) {}

    @PostMapping("/{id}/teclado")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public void crearTeclado(@PathVariable Long id, @RequestBody TecladoRequest request) {
        glpiTecladoService.crear(id, request.marca(), request.modelo(), request.numeroSerie(),
                request.codigoInventario(), request.codigoPatrimonial());
    }

    public record TecladoRequest(String marca, String modelo, String numeroSerie,
                                  String codigoInventario, String codigoPatrimonial) {}
}
