package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoImpresoraRequest {

    @NotBlank
    @Size(max = 100)
    private String nombre;
}
