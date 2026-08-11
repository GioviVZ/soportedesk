package com.inia.soportedesk.dashboard;

import java.time.LocalDate;

public record DashboardCounts(
        long licencias,
        long correos,
        long usuariosRed,
        long vpn,
        long vpnPendientes,
        long wifi,
        long impresoras,
        long equipos,
        long usuariosRedInactivos,
        long usuariosRedPorVencer,
        LocalDate proximoVencimientoUsuarioRed
) {
}
