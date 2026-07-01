package com.inia.soportedesk.equipos;

public record EquipoKpisDto(
        long totalActivos,
        long desktopCount,
        long laptopCount,
        long otrosCount,
        long sedeCentralCount,
        long eeasCount
) {
}
