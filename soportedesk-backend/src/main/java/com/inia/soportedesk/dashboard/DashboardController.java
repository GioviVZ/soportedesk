package com.inia.soportedesk.dashboard;

import lombok.RequiredArgsConstructor;
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
    public DashboardCounts getCounts() {
        return service.getCounts();
    }

    @GetMapping("/usuarios-red-por-ubicacion")
    public List<UbicacionUsuariosCount> usuariosRedPorUbicacion(@RequestParam(required = false) String nivel) {
        return service.usuariosRedPorUbicacion(nivel);
    }
}
