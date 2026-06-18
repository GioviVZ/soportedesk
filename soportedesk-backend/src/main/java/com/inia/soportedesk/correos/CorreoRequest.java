package com.inia.soportedesk.correos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CorreoRequest {

    @NotBlank
    private String usuario;

    @NotBlank
    private String nombre;

    @NotBlank
    private String apellidos;

    @NotBlank
    @Email
    private String correo;

    @NotBlank
    private String estado;

    @NotNull
    private Long sedeId;

    @NotNull
    private Long dependenciaId;

    @NotNull
    private Long subdependenciaId;

    @NotNull
    private Long tipoContratoId;

    private LocalDate fechaFinContrato;

    @NotNull
    private LocalDate creado;
}
