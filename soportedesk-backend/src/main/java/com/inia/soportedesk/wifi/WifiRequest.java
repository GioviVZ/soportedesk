package com.inia.soportedesk.wifi;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WifiRequest {

    @NotBlank
    private String ssid;

    @NotBlank
    private String clave;

    @NotBlank
    private String ubicacion;

    @NotBlank
    private String tipo;

    @NotBlank
    private String estado;
}
