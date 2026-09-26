package com.inia.soportedesk.herramientas.ordenes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ordenes_servicio_hitos")
@Getter
@Setter
@NoArgsConstructor
public class OrdenServicioHito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "orden_servicio_id", nullable = false)
    private OrdenServicio ordenServicio;

    @Column(nullable = false, length = 140)
    private String nombre;

    @Column(name = "dia_plazo", nullable = false)
    private Integer diaPlazo;

    @Column(nullable = false)
    private Boolean completado = false;
}
