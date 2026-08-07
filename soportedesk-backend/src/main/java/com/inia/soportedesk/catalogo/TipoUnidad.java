package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tipo_unidad")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TipoUnidad {

    @Id
    @Column(name = "tipo_unidad_id")
    private Integer id;

    @Column(name = "nombre_tipo_unidad", nullable = false)
    private String nombreTipoUnidad;
}
