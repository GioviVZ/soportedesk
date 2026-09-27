package com.inia.soportedesk.herramientas;

public record EquipoDatosResponse(
        String host,
        String ip,
        String modelo,
        String serie,
        String fabricante,
        String tipo,
        String sede,
        String usuarioContacto,
        String fuente,
        String capturadoEn
) {
}
