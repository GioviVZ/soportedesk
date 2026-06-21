package com.inia.soportedesk.licencias;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LicenciaRequest {

    @NotNull
    private Long tipoLicenciaId;

    @NotNull
    private Long tipoBienId;

    @NotBlank
    @Size(max = 300)
    private String descripcion;

    @Size(max = 200)
    private String cuentaActivacion;

    private String claveActivacion;

    @Size(max = 200)
    private String serialActivacion;

    @NotBlank
    private String ordenCompra;

    @NotBlank
    private String anio;

    @NotNull
    @Min(1)
    private Integer cantidad;
}
