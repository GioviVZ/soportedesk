package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnRequest {

    private Long usuarioRedId;

    private String titularTipo;
    private String titularNombre;
    private String titularApellidos;
    private String titularCorreo;
    private String titularEmpresa;
    private String titularMotivo;

    @NotBlank
    private String titularCargo;

    @NotBlank
    private String tipoEquipo;

    private Long glpiComputerId;

    private Boolean antivirusVerificado;

    private Boolean analisisAntivirusRealizado;

    private Boolean sistemaOperativoActualizado;

    private Boolean forticlientInstalado;

    private LocalDate vencimientoAntivirus;

    private Boolean hostActualizado;
}
