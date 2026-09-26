package com.inia.soportedesk.vpn;

public record VpnKpisDto(
        long pendientes,
        long aprobadas,
        long rechazadas,
        long observadas
) {
}
