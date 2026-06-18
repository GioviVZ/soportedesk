package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnRequest {

    @NotNull
    private Long usuarioRedId;

    private Long equipoId;

    private String ipAsignada;

    private LocalDate vence;

    @NotBlank
    private String estado;

    private String usuarioVpn;

    private String credencialVpn;
}
