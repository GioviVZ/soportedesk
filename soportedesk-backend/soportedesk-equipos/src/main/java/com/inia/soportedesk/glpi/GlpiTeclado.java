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
@Table(name = "glpi_plugin_fields_computerteclados")
@Getter
@Setter
@NoArgsConstructor
public class GlpiTeclado {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "items_id")
    private Long itemsId;

    @Column(name = "marcafield")
    private String marcafield;

    @Column(name = "modelofield")
    private String modelofield;

    @Column(name = "nmerodeseriefield")
    private String nmerodeseriefield;

    @Column(name = "cdigodeinventariofield")
    private String cdigodeinventariofield;

    @Column(name = "cdigopatrimonialfield")
    private String cdigopatrimonialfield;
}
