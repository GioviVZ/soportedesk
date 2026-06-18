package com.inia.soportedesk.equipos;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EquipoRequest {

    private String numeroSerie;
    private String codigoPatrimonial;
    private String codigoInventario;

    @NotBlank
    private String tipo;

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    private String host;
    private String ip;

    private Long usuarioRedId;
    private Long sedeId;
    private Long dependenciaId;
    private Long subdependenciaId;

    private LocalDate asignado;

    @NotBlank
    private String estado;
}
