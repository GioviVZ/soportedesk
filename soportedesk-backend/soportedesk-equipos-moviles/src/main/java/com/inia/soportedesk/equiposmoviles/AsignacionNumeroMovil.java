package com.inia.soportedesk.equiposmoviles;

import com.inia.soportedesk.catalogo.Dependencia;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "asignaciones_numero_movil")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionNumeroMovil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "equipo_movil_id", nullable = false)
    private EquipoMovil equipoMovil;

    @Column(nullable = false, length = 15)
    private String numero;

    @Column(nullable = false, length = 20)
    private String operador;

    @Column(name = "plan_nombre", length = 100)
    private String plan;

    @Column(name = "sim_iccid", length = 22)
    private String simIccid;

    @Column(name = "persona_nombre", nullable = false, length = 150)
    private String personaNombre;

    @Column(name = "persona_dni", length = 8)
    private String personaDni;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id")
    private Dependencia dependencia;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(nullable = false, length = 15)
    private String estado;

    @Column(length = 1000)
    private String observaciones;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
