package com.inia.soportedesk.impresoras;

import java.util.List;

public record ImpresoraDashboardCompleto(
        long total,
        long activas,
        long enMantenimiento,
        long deBaja,
        List<ImpresoraMarcaCount> distribucionPorMarca,
        List<ImpresoraSedeCount> distribucionPorSede,
        List<ImpresoraDependenciaCount> distribucionPorDependencia,
        List<ImpresoraSubdependenciaCount> distribucionPorSubdependencia,
        List<ImpresoraConsumibleCount> topConsumibles,
        long totalConsumiblesDistintos
) {
}
