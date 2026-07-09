package com.inia.soportedesk.vpn;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vpn/config-institucional")
@RequiredArgsConstructor
public class VpnConfigInstitucionalController {

    private static final String CAN_MANAGE =
            "hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn') || hasAuthority('WRITE_catalogos')";

    private final VpnConfigInstitucionalService service;

    @GetMapping
    @PreAuthorize(CAN_MANAGE)
    public VpnConfigInstitucional get() {
        VpnConfigInstitucional config = new VpnConfigInstitucional();
        config.setId(1L);
        config.setVencimientoAntivirus(service.getVencimiento());
        return config;
    }

    @PutMapping
    @PreAuthorize(CAN_MANAGE)
    public VpnConfigInstitucional actualizar(@Valid @RequestBody VpnConfigInstitucionalRequest request) {
        return service.actualizar(request.getVencimientoAntivirus());
    }
}
