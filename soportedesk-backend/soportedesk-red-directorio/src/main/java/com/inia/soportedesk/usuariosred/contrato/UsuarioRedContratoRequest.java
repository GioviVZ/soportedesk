package com.inia.soportedesk.usuariosred.contrato;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UsuarioRedContratoRequest {

    @NotBlank
    private String usuario;

    @NotNull
    private Long tipoContratoId;

    @NotNull
    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    private String numeroContrato;

    private String personalNombre;

    private String personalApellidos;
}
