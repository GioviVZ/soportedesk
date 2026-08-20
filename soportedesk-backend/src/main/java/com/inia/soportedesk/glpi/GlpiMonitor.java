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
 * Solo se usa como ancla para el repositorio; los datos por equipo se leen
 * con la consulta nativa en GlpiMonitorRepository (une con la tabla de
 * vinculacion equipo-periferico y con fabricante/modelo).
 */
@Entity
@Immutable
@Table(name = "glpi_monitors")
@Getter
@Setter
@NoArgsConstructor
public class GlpiMonitor {

    @Id
    private Long id;

    private String name;

    private String serial;

    @Column(name = "manufacturers_id")
    private Long manufacturersId;

    @Column(name = "monitormodels_id")
    private Long monitormodelsId;
}
