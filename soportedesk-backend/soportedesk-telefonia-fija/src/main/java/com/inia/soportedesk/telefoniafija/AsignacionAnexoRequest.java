package com.inia.soportedesk.telefoniafija;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AsignacionAnexoRequest {

    @NotNull
    private Long telefonoFijoId;

    @NotBlank
    @Pattern(regexp = "^\\d{3,6}$", message = "El anexo debe tener entre 3 y 6 dígitos")
    private String anexo;

    @Pattern(regexp = "^\\s*$|^\\d{6,9}$", message = "El número directo debe tener entre 6 y 9 dígitos")
    private String numeroDirecto;

    @NotBlank
    @Size(max = 150)
    private String personaNombre;

    @Pattern(regexp = "^\\s*$|^\\d{8}$", message = "El DNI debe tener 8 dígitos")
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
