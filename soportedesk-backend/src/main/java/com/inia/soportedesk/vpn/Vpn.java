package com.inia.soportedesk.vpn;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "vpn")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vpn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String usuario;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String tipo;

    @Column(name = "ip_asignada", nullable = false)
    private String ipAsignada;

    @Column(nullable = false)
    private LocalDate vence;

    @Column(nullable = false)
    private String estado;
}
