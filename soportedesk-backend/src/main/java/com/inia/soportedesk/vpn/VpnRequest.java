package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnRequest {

    @Size(max = 200)
    private String usuarioRedSamAccountName;

    @Pattern(regexp = "AD|EXTERNO", message = "El tipo de titular debe ser AD o EXTERNO")
    private String titularTipo;
    @Size(max = 255)
    private String titularNombre;
    @Size(max = 255)
    private String titularApellidos;
    @Email(message = "El correo del titular no es valido")
    @Size(max = 255)
    private String titularCorreo;
    @Size(max = 255)
    private String titularEmpresa;
    @Size(max = 500)
    private String titularMotivo;

    @NotBlank
    @Size(max = 255)
    private String titularCargo;

    @NotBlank(message = "El número de ticket es obligatorio")
    @Size(max = 50)
    private String numeroTicket;

    @NotBlank
    @Pattern(regexp = "INIA|PERSONAL", message = "El tipo de equipo debe ser INIA o PERSONAL")
    private String tipoEquipo;

    @Positive
    private Long glpiComputerId;

    private Boolean antivirusVerificado;

    private Boolean analisisAntivirusRealizado;

    private Boolean sistemaOperativoActualizado;

    private Boolean forticlientInstalado;

    private LocalDate vencimientoAntivirus;

    private Boolean hostActualizado;
}
