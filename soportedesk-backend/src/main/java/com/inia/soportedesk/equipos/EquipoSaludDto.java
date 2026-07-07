package com.inia.soportedesk.equipos;

public record EquipoSaludDto(
        Long computerID,
        String nombreEquipo,
        String sedeNombre,
        String tipoEquipo,
        String usuarioContacto,
        Long sinEncendidoMeses,
        Long sinActualizacionMeses,
        String nivelAlerta,
        boolean sinCodigoPatrimonial,
        boolean sinUsuario,
        boolean sinSede,
        String estadoDepuracion
) {}
