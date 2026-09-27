package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dependencias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Dependencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sede_id", nullable = false)
    private Sede sede;

    // Campos importados de GestionTI_INIA (Fase 1 del plan de normalizacion,
    // 24-jul-2026) -- solo lectura, no forman parte de DependenciaRequest.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_padre_id")
    @JsonIgnore // evita ciclos cuando la dependencia importada se referencia a si misma
    private Dependencia dependenciaPadre;

    @Column(name = "org_unit_path")
    private String orgUnitPath;

    public Dependencia(Long id, String nombre, Sede sede) {
        this.id = id;
        this.nombre = nombre;
        this.sede = sede;
    }
}
