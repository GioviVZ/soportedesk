package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoBienRequest {

    @NotBlank
    private String nombre;
}
