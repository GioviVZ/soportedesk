package com.inia.soportedesk.equiposmoviles;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipos_moviles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EquipoMovil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoEquipoMovil tipo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id")
    private Dependencia dependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subdependencia_id")
    private Subdependencia subdependencia;

    @Column(length = 255)
    private String referencia;

    @Column(precision = 9, scale = 6)
    private BigDecimal latitud;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitud;

    @Column(length = 100)
    private String edificio;

    @Column(length = 50)
    private String piso;

    @Column(nullable = false, length = 100)
    private String marca;

    @Column(nullable = false, length = 150)
    private String modelo;

    @Column(length = 100)
    private String serie;

    @Column(length = 15)
    private String imei1;

    @Column(length = 15)
    private String imei2;

    @Column(length = 17)
    private String mac;

    @Column(name = "sistema_operativo", length = 100)
    private String sistemaOperativo;

    @Column(length = 50)
    private String almacenamiento;

    @Column(name = "codigo_patrimonial", length = 50)
    private String codigoPatrimonial;

    @Column(name = "codigo_inventario", length = 50)
    private String codigoInventario;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(length = 1000)
    private String observaciones;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
