package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VpnAprobarRequest {

    @NotBlank
    private String usuarioVpn;

    @NotBlank
    @Size(min = 17)
    private String credencialVpn;

    @NotBlank
    private String estado;
}
