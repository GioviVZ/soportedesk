package com.inia.soportedesk.vpn;

import java.util.List;

public record VpnDashboardCompleto(
        long pendientes,
        long aprobadas,
        long rechazadas,
        long observadas,
        long total,
        List<VpnTipoEquipoCount> distribucionPorTipoEquipo,
        List<VpnDependenciaCount> distribucionPorDependencia,
        List<VpnSubdependenciaCount> distribucionPorSubdependencia,
        List<VpnVencimientoAlerta> antivirusVencidos,
        long totalAntivirusVencidos,
        List<VpnVencimientoAlerta> antivirusPorVencer,
        long totalAntivirusPorVencer
) {
}
