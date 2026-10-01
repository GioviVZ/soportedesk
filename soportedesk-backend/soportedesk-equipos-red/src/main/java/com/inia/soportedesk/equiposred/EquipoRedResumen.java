package com.inia.soportedesk.equiposred;

public record EquipoRedResumen(
        long total,
        long operativos,
        long enRevision,
        long inactivos,
        long deBaja,
        long sedes) {
}
