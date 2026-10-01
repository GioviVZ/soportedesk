package com.inia.soportedesk.equiposred;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class EquipoRedRequest {

    @NotNull
    private TipoEquipoRed tipo;

    private Long sedeId;
    private Long dependenciaId;
    private Long subdependenciaId;
    private Long remotoSedeId;

    @Size(max = 255)
    private String referencia;

    @Size(max = 255)
    private String remotoReferencia;

    @DecimalMin("-90")
    @DecimalMax("90")
    private BigDecimal latitud;

    @DecimalMin("-180")
    @DecimalMax("180")
    private BigDecimal longitud;

    @Size(max = 100)
    private String edificio;

    @Size(max = 50)
    private String piso;

    @Size(max = 100)
    private String gabinete;

    @NotBlank
    @Size(max = 100)
    private String marca;

    @NotBlank
    @Size(max = 150)
    private String modelo;

    @Size(max = 100)
    private String serie;

    @Size(max = 50)
    private String codigoPatrimonial;

    @Size(max = 50)
    private String codigoInventario;

    @Size(max = 100)
    private String etiqueta;

    @Pattern(
            regexp = "^$|^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$",
            message = "La MAC no es válida")
    private String mac;

    @Size(max = 45)
    private String ip;

    @Size(max = 45)
    private String ipPorDefecto;

    @Size(max = 100)
    private String host;

    @NotBlank
    @Pattern(
            regexp = "Operativo|En revisión|Inactivo|De baja",
            message = "El estado del equipo no es válido")
    private String estado;

    @Size(max = 1000)
    private String observaciones;

    @DecimalMin(value = "0", inclusive = false)
    @DecimalMax("100")
    private BigDecimal frecuenciaGhz;

    @Min(1)
    @Max(1000)
    private Integer anchoCanalMhz;

    @Size(max = 64)
    private String ssidEnlace;
}
