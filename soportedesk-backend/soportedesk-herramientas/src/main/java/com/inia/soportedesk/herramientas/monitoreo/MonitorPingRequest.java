package com.inia.soportedesk.herramientas.monitoreo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MonitorPingRequest {

    @NotBlank(message = "El nombre del monitoreo es obligatorio")
    @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
    private String nombre;

    @NotBlank(message = "La IP o dominio es obligatorio")
    @Size(max = 255, message = "El host no puede superar 255 caracteres")
    @Pattern(
            regexp = "^[a-zA-Z0-9._:-]+$",
            message = "El host solo puede contener letras, numeros, puntos, guiones, dos puntos y guion bajo"
    )
    private String host;

    @Min(value = 5, message = "El intervalo minimo es 5 segundos")
    @Max(value = 3600, message = "El intervalo maximo es 3600 segundos")
    private Integer intervaloSegundos = 10;
}
