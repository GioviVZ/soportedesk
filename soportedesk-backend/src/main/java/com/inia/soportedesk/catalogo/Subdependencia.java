package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "subdependencias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Subdependencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id", nullable = false)
    private Dependencia dependencia;
}
