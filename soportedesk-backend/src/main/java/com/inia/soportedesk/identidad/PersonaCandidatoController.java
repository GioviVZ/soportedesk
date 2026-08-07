package com.inia.soportedesk.identidad;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Bandeja de revision de la reconciliacion de identidad. Solo ADMIN --
 * confirmar un candidato crea una persona real, es una operacion
 * sensible que no se abre a mas roles sin que el equipo lo pida.
 */
@RestController
@RequestMapping("/api/personas/candidatos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PersonaCandidatoController {

    private final PersonaReconciliacionService service;

    @GetMapping
    public List<PersonaCandidato> listarPendientes() {
        return service.listarPendientes();
    }

    @PostMapping("/detectar-ahora")
    public Map<String, Integer> detectarAhora() {
        int nuevos = service.detectarCandidatosNuevos();
        return Map.of("nuevos", nuevos, "totalPendientes", service.listarPendientes().size());
    }

    @PostMapping("/{id}/confirmar")
    public Map<String, Long> confirmar(@PathVariable Long id, Authentication auth) {
        Long personaId = service.confirmar(id, auth.getName());
        return Map.of("personaId", personaId);
    }

    @PostMapping("/{id}/descartar")
    public void descartar(@PathVariable Long id, Authentication auth) {
        service.descartar(id, auth.getName());
    }
}
