package com.inia.soportedesk.dashboard;

public record DashboardCounts(
        long licencias,
        long correos,
        long usuariosRed,
        long vpn,
        long wifi,
        long impresoras,
        long equipos,
        long usuariosRedInactivos
) {
}
