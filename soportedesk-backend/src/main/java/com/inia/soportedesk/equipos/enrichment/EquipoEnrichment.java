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

    @Column(name = "estado_depuracion")
    private String estadoDepuracion;

    private String observaciones;

    @Column(name = "revisado_por")
    private String revisadoPor;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;
}
