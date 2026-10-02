package com.inia.soportedesk.equiposmoviles;

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
public class EquipoMovilRequest {

    @NotNull
    private TipoEquipoMovil tipo;

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

    private String imei1;
    private String imei2;

    @Pattern(
            regexp = "^\\s*$|^\\s*([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\\s*$",
            message = "La MAC no es válida")
    private String mac;

    @Size(max = 100)
    private String sistemaOperativo;

    @Size(max = 50)
    private String almacenamiento;

    @Size(max = 50)
    private String codigoPatrimonial;

    @Size(max = 50)
    private String codigoInventario;

    @NotBlank
    @Pattern(
            regexp = "Operativo|En revisión|Inactivo|De baja",
            message = "El estado del equipo no es válido")
    private String estado;

    @Size(max = 1000)
    private String observaciones;
}
