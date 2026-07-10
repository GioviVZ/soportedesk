package com.inia.soportedesk.equipos;

import java.util.List;

public record EquipoDashboardCompleto(
        long total,
        long desktopCount,
        long laptopCount,
        long otrosCount,
        long sedeCentralCount,
        long eeasCount,
        List<EquipoFabricanteCount> distribucionPorFabricante,
        List<EquipoDependenciaCount> topDependencias,
        EquipoSaludResumen salud
) {
}
