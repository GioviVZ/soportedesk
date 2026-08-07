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

    // Importado de GestionTI_INIA (Fase 1 del plan de normalizacion,
    // 24-jul-2026) -- solo lectura, no forma parte de SubdependenciaRequest.
    @Column(name = "org_unit_path")
    private String orgUnitPath;

    public Subdependencia(Long id, String nombre, Dependencia dependencia) {
        this.id = id;
        this.nombre = nombre;
        this.dependencia = dependencia;
    }
}
