package com.inia.soportedesk.glpi;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entidad de escritura para glpi_plugin_fields_computerteclados. GlpiTeclado
 * (inmutable) sigue siendo la usada para lectura; esta solo se usa para
 * registrar el teclado de un equipo que todavia no lo tiene en GLPI.
 */
@Entity
@Table(name = "glpi_plugin_fields_computerteclados")
@Getter
@Setter
@NoArgsConstructor
public class GlpiComputerTeclado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "items_id", nullable = false)
    private Long itemsId;

    @Column(name = "itemtype", nullable = false)
    private String itemtype = "Computer";

    @Column(name = "plugin_fields_containers_id", nullable = false)
    private Integer pluginFieldsContainersId = 6;

    @Column(name = "entities_id", nullable = false)
    private Integer entitiesId = 0;

    @Column(name = "marcafield")
    private String marca;

    @Column(name = "modelofield")
    private String modelo;

    @Column(name = "nmerodeseriefield")
    private String numeroSerie;

    @Column(name = "cdigodeinventariofield")
    private String codigoInventario;

    @Column(name = "cdigopatrimonialfield")
    private String codigoPatrimonial;
}
