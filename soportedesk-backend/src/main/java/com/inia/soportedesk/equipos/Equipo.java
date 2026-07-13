package com.inia.soportedesk.equipos;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "equipos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_serie", unique = true)
    private String numeroSerie;

    @Column(name = "codigo_patrimonial")
    private String codigoPatrimonial;

    @Column(name = "codigo_inventario")
    private String codigoInventario;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    private String host;
    private String ip;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id")
    private Dependencia dependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subdependencia_id")
    private Subdependencia subdependencia;

    private LocalDate asignado;

    @Column(nullable = false)
    private String estado;
}
