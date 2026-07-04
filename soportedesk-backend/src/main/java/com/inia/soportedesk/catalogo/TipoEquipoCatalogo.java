package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "equipo_tipo_catalogo")
@Getter
@Setter
@NoArgsConstructor
public class TipoEquipoCatalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "glpi_valor", nullable = false, unique = true)
    private String glpiValor;

    @Column(name = "tipo_normalizado", nullable = false)
    private String tipoNormalizado;

    @Column(nullable = false)
    private boolean activo = true;
}
