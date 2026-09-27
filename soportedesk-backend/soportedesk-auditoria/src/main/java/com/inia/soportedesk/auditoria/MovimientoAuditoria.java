package com.inia.soportedesk.auditoria;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_auditoria")
@Getter
@Setter
@NoArgsConstructor
public class MovimientoAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false, length = 80)
    private String usuario;

    @Column(nullable = false, length = 30)
    private String accion;

    @Column(nullable = false, length = 60)
    private String modulo;

    @Column(nullable = false, length = 10)
    private String metodo;

    @Column(nullable = false, length = 300)
    private String ruta;

    @Column(name = "entidad_id", length = 80)
    private String entidadId;

    @Column(name = "estado_http")
    private Integer estadoHttp;

    @Column(length = 80)
    private String ip;

    @Column(length = 500)
    private String detalle;
}
