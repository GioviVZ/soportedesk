package com.inia.soportedesk.inventario;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inventario-equipos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_inventario-equipos')")
public class InventarioEquipoController {

    private final InventarioEquipoService service;

    @GetMapping
    public List<InventarioEquipoResponse> getAll(@RequestParam(required = false) String search) {
        return service.getAll(search);
    }

    @GetMapping("/{id}")
    public InventarioEquipoResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping("/{id}/match")
    public InventarioEquipoResponse rematch(@PathVariable Long id) {
        return service.rematch(id);
    }

    @PostMapping("/{id}/match/manual")
    public InventarioEquipoResponse manualMatch(
            @PathVariable Long id,
            @Valid @org.springframework.web.bind.annotation.RequestBody InventarioMatchManualRequest request
    ) {
        return service.manualMatch(id, request);
    }

    @PostMapping("/match")
    public List<InventarioEquipoResponse> rematchAll(@RequestParam(required = false) String search) {
        return service.rematchAll(search);
    }
}
