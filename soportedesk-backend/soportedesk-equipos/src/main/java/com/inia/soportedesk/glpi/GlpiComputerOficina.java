package com.inia.soportedesk.glpi;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Table(name = "glpi_plugin_fields_computeroficinas")
@Getter
@Setter
@NoArgsConstructor
public class GlpiComputerOficina {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "items_id")
    private Long itemsId;

    @Column(name = "siglafield")
    private String siglafield;

    @Column(name = "reafield")
    private String reafield;
}
