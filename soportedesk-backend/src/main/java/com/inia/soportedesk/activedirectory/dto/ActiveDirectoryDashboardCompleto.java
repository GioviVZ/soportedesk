package com.inia.soportedesk.activedirectory.dto;

import java.util.List;

public record ActiveDirectoryDashboardCompleto(
        int usuariosHabilitados,
        int usuariosDeshabilitados,
        int usuariosBloqueados,
        int controladoresDominio,
        List<OuUsuariosCount> distribucionPorOu,
        List<AdUserAlerta> passwordsVencidas,
        int totalPasswordsVencidas,
        List<AdUserAlerta> cuentasInactivas,
        int totalCuentasInactivas,
        List<AdUserAlerta> cuentasBloqueadas,
        int totalCuentasBloqueadas
) {
}
