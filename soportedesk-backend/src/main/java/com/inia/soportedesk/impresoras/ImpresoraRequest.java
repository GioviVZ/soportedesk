package com.inia.soportedesk.impresoras;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImpresoraRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    private String ip;

    private String piso;

    private String area;

    @NotBlank
    private String estado;

    @Min(0) @Max(100)
    private Integer tonerNegro;

    @Min(0) @Max(100)
    private Integer tonerC;

    @Min(0) @Max(100)
    private Integer tonerM;

    @Min(0) @Max(100)
    private Integer tonerY;

    @Min(0) @Max(100)
    private Integer cartucho;

    @Min(0) @Max(100)
    private Integer drum;

    @Min(0) @Max(100)
    private Integer fusor;
}
