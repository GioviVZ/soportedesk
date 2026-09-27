package com.inia.soportedesk.herramientas.ordenes;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrdenServicioHitoRequest {

    private Long id;

    @NotBlank(message = "El nombre del entregable es obligatorio")
    @Size(max = 140, message = "El nombre del entregable no puede superar 140 caracteres")
    private String nombre;

    @NotNull(message = "El día del entregable es obligatorio")
    @Min(value = 1, message = "El día del entregable debe ser mayor a cero")
    @Max(value = 3650, message = "El día del entregable no puede superar 3650 días")
    private Integer diaPlazo;
}
