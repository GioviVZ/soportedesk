package com.inia.soportedesk.auditoria;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdAuditoriaRegistro(
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
        String userAgent,
        UUID idTransaccion,
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin
) {
}
