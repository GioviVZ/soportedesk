package com.inia.soportedesk.correos;

public record CorreoKpisDto(
        int licenciasTotales,
        int licenciasAsignadas,
        int licenciasDisponibles,
        long activasCount,
        long suspendidasCount,
        int sedeCentralCount,
        int eeasCount
) {}
