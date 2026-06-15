package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnRequest {

    @NotBlank
    private String usuario;

    @NotBlank
    private String nombre;

    @NotBlank
    private String tipo;

    @NotBlank
    private String ipAsignada;

    @NotNull
    private LocalDate vence;

    @NotBlank
    private String estado;
}
