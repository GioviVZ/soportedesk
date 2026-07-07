package com.inia.soportedesk.equipos;

import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentDto;
import com.inia.soportedesk.glpi.GlpiTeclado;
import com.inia.soportedesk.glpi.SoftwareRow;
import com.inia.soportedesk.glpi.VwInvComputerFull;

import java.util.List;

public record EquipoDetalleResponse(
        VwInvComputerFull equipo,
        List<SoftwareRow> software,
        GlpiTeclado teclado,
        String tipoEfectivo,
        EquipoEnrichmentDto enrichment
) {}
