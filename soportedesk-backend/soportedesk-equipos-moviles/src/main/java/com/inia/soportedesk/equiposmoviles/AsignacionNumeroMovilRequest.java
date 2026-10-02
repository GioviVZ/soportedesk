package com.inia.soportedesk.equiposmoviles;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AsignacionNumeroMovilRequest {

    @NotNull
    private Long equipoMovilId;

    @NotBlank
    private String numero;

    @NotBlank
    @Pattern(regexp = "Claro|Movistar|Entel|Bitel|Otro", message = "El operador no es válido")
    private String operador;

    @Size(max = 100)
    private String plan;

    private String simIccid;

    @NotBlank
    @Size(max = 150)
    private String personaNombre;

    private String personaDni;
    private Long dependenciaId;

    @NotNull
    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @NotBlank
    @Pattern(regexp = "Activa|Finalizada", message = "El estado de la asignación no es válido")
    private String estado;

    @Size(max = 1000)
    private String observaciones;
}
