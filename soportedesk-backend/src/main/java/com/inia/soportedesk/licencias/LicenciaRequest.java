package com.inia.soportedesk.licencias;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LicenciaRequest {

    @NotNull
    @Min(1)
    private Integer cantidad;

    @NotBlank
    private String licencia;

    @NotBlank
    @Email
    private String correo;

    @NotBlank
    private String clave;

    @NotBlank
    private String ordenCompra;

    @NotBlank
    private String anio;
}
