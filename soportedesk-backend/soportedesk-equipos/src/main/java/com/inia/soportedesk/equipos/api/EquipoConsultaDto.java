package com.inia.soportedesk.equipos.api;

public record EquipoConsultaDto(
        Long computerId,
        String nombreEquipo,
        String ipEquipo,
        String modeloEquipo,
        String numeroSerie,
        String fabricanteEquipo,
        String tipoEquipo,
        String sedeNombre,
        String sedeNombreCompleto,
        String usuarioContacto) {
}
