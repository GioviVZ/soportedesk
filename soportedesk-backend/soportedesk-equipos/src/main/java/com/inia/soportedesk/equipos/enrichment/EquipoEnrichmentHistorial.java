package com.inia.soportedesk.equipos.enrichment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "equipos_enrichment_historial")
@Getter
@Setter
@NoArgsConstructor
public class EquipoEnrichmentHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "computer_id", nullable = false)
    private Long computerId;

    @Column(nullable = false)
    private String campo;

    @Column(name = "valor_anterior")
    private String valorAnterior;

    @Column(name = "valor_nuevo")
    private String valorNuevo;

    @Column(name = "modificado_por", nullable = false)
    private String modificadoPor;

    @Column(name = "fecha_modificacion", nullable = false)
    private LocalDateTime fechaModificacion;
}
