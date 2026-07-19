package com.inia.soportedesk.herramientas.ordenes;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record OrdenServicioResponse(
        Long id,
        String numeroOrden,
        String descripcion,
        String proveedor,
        LocalDate fechaInicio,
        Integer plazoDias,
        LocalDate fechaVencimiento,
        long diasRestantes,
        boolean finalizada,
        String registradoPor,
        LocalDateTime fechaRegistro
) {
}
