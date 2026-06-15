package com.inia.soportedesk.equipos;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EquipoRequest {

    @NotBlank
    private String codigo;

    @NotBlank
    private String tipo;

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    @NotBlank
    private String usuario;

    @NotBlank
    private String area;

    private LocalDate asignado;

    @NotBlank
    private String estado;
}
