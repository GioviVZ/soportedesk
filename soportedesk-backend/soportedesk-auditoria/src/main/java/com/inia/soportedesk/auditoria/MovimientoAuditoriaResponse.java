package com.inia.soportedesk.auditoria;

import java.time.LocalDateTime;

public record MovimientoAuditoriaResponse(
        Long id,
        LocalDateTime fecha,
        String usuario,
        String accion,
        String modulo,
        String metodo,
        String ruta,
        String entidadId,
        Integer estadoHttp,
        String ip,
        String detalle
) {
}
