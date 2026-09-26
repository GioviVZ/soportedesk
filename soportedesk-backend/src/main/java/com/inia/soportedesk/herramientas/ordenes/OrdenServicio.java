package com.inia.soportedesk.herramientas.ordenes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordenes_servicio")
@Getter
@Setter
@NoArgsConstructor
public class OrdenServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_orden", nullable = false, length = 100, unique = true)
    private String numeroOrden;

    @Column(nullable = false, length = 300)
    private String descripcion;

    @Column(length = 200)
    private String proveedor;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "plazo_dias", nullable = false)
    private Integer plazoDias;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(nullable = false)
    private Boolean finalizada = false;

    @OneToMany(mappedBy = "ordenServicio", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @OrderBy("diaPlazo ASC, id ASC")
    private List<OrdenServicioHito> hitos = new ArrayList<>();
}
