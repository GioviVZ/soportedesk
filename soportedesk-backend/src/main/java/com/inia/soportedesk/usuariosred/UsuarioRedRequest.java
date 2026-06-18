package com.inia.soportedesk.usuariosred;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class UsuarioRedRequest {

    @NotBlank
    private String usuario;

    @NotBlank
    private String nombre;

    @NotBlank
    private String apellidos;

    @NotBlank
    private String grupo;

    private String unidadOrganizativa;

    private LocalDateTime ultimoLogin;

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

    private LocalDate fechaCreacion;

    private String numeroContrato;
}
