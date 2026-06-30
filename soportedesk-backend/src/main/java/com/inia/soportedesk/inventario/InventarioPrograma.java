package com.inia.soportedesk.inventario;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "inventario_programas")
@Getter
@Setter
public class InventarioPrograma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventario_equipo_id", nullable = false)
    @JsonIgnore
    private InventarioEquipo equipo;

    @Column(nullable = false, length = 300)
    private String nombre;

    @Column(length = 120)
    private String version;

    @Column(length = 220)
    private String fabricante;

    @Column(name = "fecha_instalacion", length = 60)
    private String fechaInstalacion;
}
