package com.inia.soportedesk.auditoria;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdAuditoriaResponse(
        Long id,
        LocalDateTime fechaRegistro,
        String operadorUsuario,
        String operadorNombre,
        String usuarioAfectado,
        String usuarioAfectadoDn,
        String accion,
        String resultado,
        String mensaje,
        String detalleError,
        String estadoAnterior,
        String estadoNuevo,
        String recursoAfectado,
        String endPoint,
        String metodoHttp,
        String ipOrigen,
        UUID idTransaccion,
        Integer duracionMs
) {
}
