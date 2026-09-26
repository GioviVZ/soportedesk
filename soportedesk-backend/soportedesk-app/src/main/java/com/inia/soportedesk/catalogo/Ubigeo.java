package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ubigeo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Ubigeo {

    @Id
    @Column(name = "ubigeo_id")
    private Integer id;

    @Column(name = "codigo_ubigeo")
    private String codigoUbigeo;

    private String departamento;

    private String provincia;

    private String distrito;
}
