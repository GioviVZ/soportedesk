package com.inia.soportedesk.inventario;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inventario_redes")
@Getter
@Setter
public class InventarioRed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventario_equipo_id", nullable = false)
    @JsonIgnore
    private InventarioEquipo equipo;

    @Column(length = 260)
    private String descripcion;

    @Column(name = "mac_address", length = 80)
    private String macAddress;

    @ElementCollection
    @CollectionTable(name = "inventario_red_ips", joinColumns = @JoinColumn(name = "inventario_red_id"))
    @Column(name = "ip", length = 80)
    private List<String> ipAddresses = new ArrayList<>();
}
