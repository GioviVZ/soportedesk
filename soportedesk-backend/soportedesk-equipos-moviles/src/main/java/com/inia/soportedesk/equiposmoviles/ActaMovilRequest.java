package com.inia.soportedesk.equiposmoviles;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class ActaMovilRequest {

    @NotBlank
    @Size(max = 50)
    private String numeroActa;

    @NotBlank
    @Pattern(regexp = "Entrega|Devolución|Transferencia", message = "El tipo de acta no es válido")
    private String tipo;

    @NotNull
    private LocalDate fecha;

    @NotBlank
    @Size(max = 150)
    private String personaNombre;

    private String personaDni;
    private Long dependenciaId;

    @Size(max = 1000)
    private String observaciones;

    @NotEmpty
    private List<Long> equipoMovilIds;
}
