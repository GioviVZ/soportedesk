package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "modelo_impresora_toners")
@Getter
@Setter
@NoArgsConstructor
public class ModeloImpresoraToner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_impresora_id", nullable = false)
    private ModeloImpresora modeloImpresora;

    @Column(nullable = false, length = 20)
    private String color;

    @Column(nullable = false, length = 50)
    private String variante;

    @Column(nullable = false, length = 80)
    private String codigo;
}
