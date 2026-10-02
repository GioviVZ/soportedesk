package com.inia.soportedesk.telefoniafija;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TelefonoFijoRequest {

    @NotNull
    private TipoTelefonoFijo tipo;

    private Long sedeId;
    private Long dependenciaId;
    private Long subdependenciaId;

    @Size(max = 255)
    private String referencia;

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

    @NotBlank
    @Size(max = 100)
    private String marca;

    @NotBlank
    @Size(max = 150)
    private String modelo;

    @Size(max = 100)
    private String serie;

    @Pattern(
            regexp = "^\\s*$|^\\s*([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\\s*$",
            message = "La MAC no es válida")
    private String mac;

    @Size(max = 45)
    private String ip;

    @Size(max = 100)
    private String host;

    @Size(max = 50)
    private String codigoPatrimonial;

    @Size(max = 50)
    private String codigoInventario;

    @NotBlank
    @Pattern(
            regexp = "Operativo|En revisión|Inactivo|De baja",
            message = "El estado del teléfono no es válido")
    private String estado;

    @Size(max = 1000)
    private String observaciones;
}
