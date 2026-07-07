package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VpnRequest {

    private Long usuarioRedId;

    private String titularTipo;
    private String titularNombre;
    private String titularApellidos;
    private String titularCorreo;
    private Long titularSedeId;
    private Long titularDependenciaId;
    private Long titularTipoContratoId;
    private String titularEmpresa;
    private String titularMotivo;

    @NotBlank
    private String titularCargo;

    @NotBlank
    private String tipoEquipo;

    private Long glpiComputerId;

    private Boolean antivirusVerificado;

    private Boolean analisisAntivirusRealizado;

    private Boolean hostActualizado;
}
