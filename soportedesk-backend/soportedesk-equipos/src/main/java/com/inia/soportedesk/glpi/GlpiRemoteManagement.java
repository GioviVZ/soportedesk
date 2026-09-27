package com.inia.soportedesk.glpi;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

/**
 * IDs de acceso remoto (AnyDesk, RustDesk, TeamViewer...) que el propio
 * agente de inventario de GLPI detecta y registra por equipo.
 */
@Entity
@Immutable
@Table(name = "glpi_items_remotemanagements")
@Getter
@Setter
@NoArgsConstructor
public class GlpiRemoteManagement {

    @Id
    private Long id;

    @Column(name = "items_id")
    private Long itemsId;

    @Column(name = "itemtype")
    private String itemtype;

    @Column(name = "type")
    private String type;

    @Column(name = "remoteid")
    private String remoteId;

    @Column(name = "is_deleted")
    private Integer isDeleted;
}
