package com.inia.soportedesk.correos;

import java.util.List;

public record CorreoDashboardCompleto(
        CorreoKpisDto kpis,
        List<CorreoDependenciaCount> distribucionPorDependencia,
        List<CorreoSubdependenciaCount> distribucionPorSubdependencia,
        long cuentasCon2FA,
        long totalCuentas,
        double porcentaje2FA,
        List<CorreoInactividadAlerta> sinUso,
        long totalSinUso
) {
}
