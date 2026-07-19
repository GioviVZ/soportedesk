package com.inia.soportedesk.herramientas.ordenes;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class OrdenServicioRequest {

    @NotBlank(message = "El número de orden es obligatorio")
    @Size(max = 100, message = "El número de orden no puede superar 100 caracteres")
    private String numeroOrden;

    @NotBlank(message = "La descripción del servicio es obligatoria")
    @Size(max = 300, message = "La descripción no puede superar 300 caracteres")
    private String descripcion;

    @Size(max = 200, message = "El proveedor no puede superar 200 caracteres")
    private String proveedor;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    @NotNull(message = "El plazo en días es obligatorio")
    @Min(value = 0, message = "El plazo no puede ser negativo")
    @Max(value = 3650, message = "El plazo no puede superar 3650 días")
    private Integer plazoDias;
}
