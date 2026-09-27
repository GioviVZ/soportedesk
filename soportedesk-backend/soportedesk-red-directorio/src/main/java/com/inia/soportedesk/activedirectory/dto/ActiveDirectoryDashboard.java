package com.inia.soportedesk.activedirectory.dto;

public record ActiveDirectoryDashboard(
        int usuariosHabilitados,
        int usuariosBloqueados,
        int usuariosDeshabilitados,
        int controladoresDominio
) {
}
