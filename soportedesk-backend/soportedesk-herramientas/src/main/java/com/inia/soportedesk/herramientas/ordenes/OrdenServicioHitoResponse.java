package com.inia.soportedesk.herramientas.ordenes;

import java.time.LocalDate;

public record OrdenServicioHitoResponse(
        Long id,
        String nombre,
        Integer diaPlazo,
        LocalDate fechaVencimiento,
        long diasRestantes,
        boolean completado
) {
}
