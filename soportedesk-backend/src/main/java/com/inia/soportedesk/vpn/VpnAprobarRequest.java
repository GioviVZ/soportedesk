package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VpnAprobarRequest {

    @NotBlank
    private String usuarioVpn;

    @NotBlank
    private String credencialVpn;

    @NotBlank
    private String estado;
}
