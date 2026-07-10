package com.inia.soportedesk.equipos.enrichment;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class EquipoEnrichmentDto {
    private String tipoOverride;
    private String fabricanteOverride;
    private String modeloOverride;
    private String codigoPatrimonial;
    private Long sedeId;
    private String sedeNombre;
    private Long dependenciaId;
    private String dependenciaNombre;
    private Long subdependenciaId;
    private String subdependenciaNombre;
    private String numeroSerieOverride;
    private String estadoDepuracion;
    private String observaciones;
    private String revisadoPor;
    private LocalDateTime fechaRevision;
}
