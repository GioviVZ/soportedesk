package com.inia.soportedesk.herramientas;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/herramientas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_herramientas')")
public class HerramientasController {

    private final HerramientasService service;

    @PostMapping("/ping")
    public PingResult ping(@Valid @RequestBody PingRequest request) {
        return service.ping(request.getHost());
    }

    @GetMapping("/datos-equipo")
    public EquipoDatosResponse datosEquipo(@RequestParam(required = false) String referencia,
                                           HttpServletRequest request) {
        return service.datosEquipo(referencia, request);
    }
}
