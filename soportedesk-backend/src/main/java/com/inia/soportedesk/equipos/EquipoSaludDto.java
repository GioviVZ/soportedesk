package com.inia.soportedesk.equipos;

import java.time.LocalDateTime;

public record EquipoSaludDto(
        Long computerID,
        String nombreEquipo,
        String sedeNombre,
        String tipoEquipo,
        String usuarioContacto,
        LocalDateTime fechaCreacion,
        Long sinEncendidoMeses,
        Long sinActualizacionMeses,
        String nivelAlerta,
        boolean sinCodigoPatrimonial,
        boolean sinUsuario,
        boolean sinSede,
        boolean sinDependencia,
        boolean sinSubdependencia,
        boolean sinNumeroSerie,
        String estadoDepuracion
) {}
