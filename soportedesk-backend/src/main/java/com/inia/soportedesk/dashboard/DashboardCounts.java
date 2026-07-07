package com.inia.soportedesk.dashboard;

public record DashboardCounts(
        long licencias,
        long correos,
        long usuariosRed,
        long vpn,
        long vpnPendientes,
        long wifi,
        long impresoras,
        long equipos,
        long usuariosRedInactivos
) {
}
