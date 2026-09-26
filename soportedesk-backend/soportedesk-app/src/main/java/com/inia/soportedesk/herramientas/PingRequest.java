package com.inia.soportedesk.herramientas;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PingRequest {

    @NotBlank(message = "El host es obligatorio")
    @Size(max = 253, message = "El host es demasiado largo")
    @Pattern(
            regexp = "^[A-Za-z0-9][A-Za-z0-9._:-]*$",
            message = "El host solo puede contener letras, numeros, puntos, guiones, dos puntos y guion bajo"
    )
    private String host;
}
