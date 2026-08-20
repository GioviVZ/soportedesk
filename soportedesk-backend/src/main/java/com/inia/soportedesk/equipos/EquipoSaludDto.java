package com.inia.soportedesk.equipos;

import java.time.LocalDateTime;

public record EquipoSaludDto(
        Long computerID,
        String nombreEquipo,
        String sedeNombre,
        String dependenciaNombre,
        String subdependenciaNombre,
        String tipoEquipo,
        String fabricanteEquipo,
        String modeloEquipo,
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
