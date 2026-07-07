package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnAprobarRequest {

    @NotBlank
    private String usuarioVpn;

    @NotBlank
    private String credencialVpn;

    @NotBlank
    private String ipAsignada;

    private LocalDate vence;

    @NotBlank
    private String estado;
}
