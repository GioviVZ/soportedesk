package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoLicenciaRequest {

    @NotBlank
    private String nombre;
}
