package com.inia.soportedesk.inventario;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "inventario_discos")
@Getter
@Setter
public class InventarioDisco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventario_equipo_id", nullable = false)
    @JsonIgnore
    private InventarioEquipo equipo;

    @Column(length = 20)
    private String letra;

    @Column(length = 120)
    private String nombre;

    @Column(name = "tipo", length = 80)
    private String tipo;

    @Column(name = "total_bytes")
    private Long totalBytes;

    @Column(name = "libre_bytes")
    private Long libreBytes;
}
