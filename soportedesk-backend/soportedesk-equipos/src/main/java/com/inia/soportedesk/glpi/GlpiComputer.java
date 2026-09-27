package com.inia.soportedesk.glpi;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "glpi_computers")
@Getter
@Setter
@NoArgsConstructor
public class GlpiComputer {

    @Id
    private Long id;

    @Column(name = "is_deleted")
    private Integer isDeleted;
}
