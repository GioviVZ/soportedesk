package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VpnResolucionRequest {

    @NotBlank
    private String comentarioResponsable;
}
