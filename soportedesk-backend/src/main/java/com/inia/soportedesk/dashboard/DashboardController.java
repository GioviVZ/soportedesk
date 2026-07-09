package com.inia.soportedesk.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/counts")
    public DashboardCounts getCounts(Authentication auth) {
        return service.getCounts(auth);
    }

    @GetMapping("/usuarios-red-por-ubicacion")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public List<UbicacionUsuariosCount> usuariosRedPorUbicacion(@RequestParam(required = false) String nivel) {
        return service.usuariosRedPorUbicacion(nivel);
    }

    @GetMapping("/licencias-por-tipo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_licencias')")
    public List<LicenciaTipoCount> licenciasPorTipo() {
        return service.licenciasPorTipo();
    }
}
