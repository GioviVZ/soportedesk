package com.inia.soportedesk.equipos;

import com.inia.soportedesk.equipos.glpicache.EquipoGlpiCache;
import com.inia.soportedesk.glpi.GlpiComputerOficina;
import com.inia.soportedesk.glpi.GlpiTeclado;
import com.inia.soportedesk.glpi.SoftwareRow;

import java.util.List;

public record EquipoDetalleResponse(
        EquipoGlpiCache equipo,
        List<SoftwareRow> software,
        GlpiTeclado teclado,
        GlpiComputerOficina oficina,
        String tipoEfectivo
) {}
