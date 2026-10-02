package com.inia.soportedesk.equiposmoviles;

public record ActaMovilResumen(
        long total,
        long entregas,
        long devoluciones,
        long transferencias) {
}
