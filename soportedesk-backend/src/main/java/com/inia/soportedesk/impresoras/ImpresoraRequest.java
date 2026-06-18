package com.inia.soportedesk.impresoras;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    private Long sedeId;
    private Long dependenciaId;
    private Long subdependenciaId;

    @NotBlank
    private String estado;

    @Size(max = 100)
    private String modeloTonerNegro;

    @Size(max = 100)
    private String modeloTonerC;

    @Size(max = 100)
    private String modeloTonerM;

    @Size(max = 100)
    private String modeloTonerY;

    @Size(max = 100)
    private String modeloCartucho;

    @Size(max = 100)
    private String modeloDrum;

    @Size(max = 100)
    private String modeloFusor;
}
