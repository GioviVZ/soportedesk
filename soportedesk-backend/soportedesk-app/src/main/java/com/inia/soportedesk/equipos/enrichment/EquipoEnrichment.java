package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "equipos_enrichment")
@Getter
@Setter
@NoArgsConstructor
public class EquipoEnrichment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "computer_id", nullable = false, unique = true)
    private Long computerId;

    @Column(name = "tipo_override")
    private String tipoOverride;

    @Column(name = "fabricante_override")
    private String fabricanteOverride;

    @Column(name = "modelo_override")
    private String modeloOverride;

    @Column(name = "codigo_patrimonial")
    private String codigoPatrimonial;

    @Column(name = "codigo_interno_override")
    private String codigoInternoOverride;

    @Column(name = "nombre_asignado_override")
    private String nombreAsignadoOverride;

    @Column(name = "usuario_asignado_override")
    private String usuarioAsignadoOverride;

    @ManyToOne
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToOne
    @JoinColumn(name = "dependencia_id")
    private Dependencia dependencia;

    @ManyToOne
    @JoinColumn(name = "subdependencia_id")
    private Subdependencia subdependencia;

    @Column(name = "numero_serie_override")
    private String numeroSerieOverride;

    @Column(name = "monitor_fabricante_override")
    private String monitorFabricanteOverride;

    @Column(name = "monitor_modelo_override")
    private String monitorModeloOverride;

    @Column(name = "monitor_numero_serie_override")
    private String monitorNumeroSerieOverride;

    @Column(name = "monitor_codigo_patrimonial")
    private String monitorCodigoPatrimonial;

    @Column(name = "monitor_codigo_interno_override")
    private String monitorCodigoInternoOverride;

    @Column(name = "monitor2_fabricante_override")
    private String monitor2FabricanteOverride;

    @Column(name = "monitor2_modelo_override")
    private String monitor2ModeloOverride;

    @Column(name = "monitor2_numero_serie_override")
    private String monitor2NumeroSerieOverride;

    @Column(name = "monitor2_codigo_patrimonial")
    private String monitor2CodigoPatrimonial;

    @Column(name = "monitor2_codigo_interno_override")
    private String monitor2CodigoInternoOverride;

    @Column(name = "estado_depuracion")
    private String estadoDepuracion;

    private String observaciones;

    @Column(name = "revisado_por")
    private String revisadoPor;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    private void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
