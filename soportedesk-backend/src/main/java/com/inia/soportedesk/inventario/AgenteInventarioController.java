package com.inia.soportedesk.inventario;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agente")
@RequiredArgsConstructor
public class AgenteInventarioController {

    private static final String TOKEN_HEADER = "X-SoporteDesk-Agent-Token";

    private final InventarioEquipoService service;

    @PostMapping("/inventario")
    public InventarioEquipoResponse receiveInventory(
            @RequestHeader(value = TOKEN_HEADER, required = false) String token,
            @Valid @RequestBody InventarioAgenteRequest request,
            HttpServletRequest servletRequest
    ) {
        return service.receiveFromAgent(request, token, clientIp(servletRequest));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
