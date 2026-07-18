package com.inia.soportedesk.impresoras.intervencion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ImpresoraIntervencionRequest {

    @NotNull
    private LocalDate fecha;

    @NotBlank
    @Size(max = 1000)
    private String observacion;
}
