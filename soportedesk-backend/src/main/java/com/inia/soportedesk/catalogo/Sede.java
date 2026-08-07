package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sedes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Sede {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    // Campos importados de GestionTI_INIA (Fase 1 del plan de normalizacion,
    // 24-jul-2026) -- solo lectura desde esta entidad, no forman parte de
    // SedeRequest: son datos de referencia sincronizados, no editables a
    // mano desde el formulario de sedes.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ubigeo_id")
    private Ubigeo ubigeo;

    private String direccion;

    @Column(name = "tipo_sede")
    private String tipoSede;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_unidad_id")
    private TipoUnidad tipoUnidad;

    public Sede(Long id, String nombre) {
        this.id = id;
        this.nombre = nombre;
    }
}
