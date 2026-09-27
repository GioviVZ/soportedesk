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
    private String codigoInternoOverride;
    private String nombreAsignadoOverride;
    private String usuarioAsignadoOverride;
    private Long sedeId;
    private String sedeNombre;
    private Long dependenciaId;
    private String dependenciaNombre;
    private Long subdependenciaId;
    private String subdependenciaNombre;
    private String numeroSerieOverride;
    private String monitorFabricanteOverride;
    private String monitorModeloOverride;
    private String monitorNumeroSerieOverride;
    private String monitorCodigoPatrimonial;
    private String monitorCodigoInternoOverride;
    private String monitor2FabricanteOverride;
    private String monitor2ModeloOverride;
    private String monitor2NumeroSerieOverride;
    private String monitor2CodigoPatrimonial;
    private String monitor2CodigoInternoOverride;
    private String estadoDepuracion;
    private String observaciones;
    private String revisadoPor;
    private LocalDateTime fechaRevision;
}
