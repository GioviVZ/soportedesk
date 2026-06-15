package com.inia.soportedesk.licencias;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "licencias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Licencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false)
    private String licencia;

    @Column(nullable = false)
    private String correo;

    @Column(nullable = false)
    private String clave;

    @Column(name = "orden_compra", nullable = false)
    private String ordenCompra;

    @Column(nullable = false)
    private String anio;
}
