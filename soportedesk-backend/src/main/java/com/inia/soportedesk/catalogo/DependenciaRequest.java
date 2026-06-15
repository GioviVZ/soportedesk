package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DependenciaRequest {

    @NotBlank
    private String nombre;

    @NotNull
    private Long sedeId;
}
