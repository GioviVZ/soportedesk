package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnDatosRequest {

    @NotNull
    private Long usuarioRedId;

    private Long equipoId;

    private String ipAsignada;

    private LocalDate vence;

    private String estado;
}
