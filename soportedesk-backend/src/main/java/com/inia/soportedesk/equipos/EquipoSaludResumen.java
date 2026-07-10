package com.inia.soportedesk.equipos;

public record EquipoSaludResumen(
        long rojos,
        long amarillos,
        long ok,
        long sinPatrimonial,
        long sinUsuario,
        long sinSede
) {
}
