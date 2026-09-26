package com.inia.soportedesk.herramientas.ordenes;

import java.time.LocalDate;
import java.util.List;

public record OrdenServicioResponse(
        Long id,
        String numeroOrden,
        String descripcion,
        String proveedor,
        LocalDate fechaInicio,
        Integer plazoDias,
        LocalDate fechaVencimiento,
        long diasRestantes,
        long diasTranscurridos,
        List<OrdenServicioHitoResponse> hitos,
        boolean finalizada
) {
}
