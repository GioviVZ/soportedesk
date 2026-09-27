package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VpnAprobarRequest {

    @NotBlank
    @Size(max = 255)
    private String usuarioVpn;

    @NotBlank
    @Size(min = 17, max = 255)
    private String credencialVpn;

    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "Activo|Inactivo", message = "El estado del acceso VPN no es valido")
    private String estado;
}
